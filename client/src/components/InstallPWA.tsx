import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { 
  Download, 
  Bell, 
  BellOff, 
  Smartphone, 
  CheckCircle2, 
  XCircle,
  Settings,
  Send
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Detectar instalação
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('App instalado com sucesso!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      toast.success('Instalando o app...');
    }
    
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>App instalado</span>
      </div>
    );
  }

  if (isIOS) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Instalar App
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar no iPhone/iPad</DialogTitle>
            <DialogDescription>
              Siga os passos abaixo para instalar o app:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Toque no botão Compartilhar</p>
                <p className="text-sm text-muted-foreground">
                  O ícone de compartilhar fica na barra inferior do Safari
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Selecione "Adicionar à Tela de Início"</p>
                <p className="text-sm text-muted-foreground">
                  Role para baixo no menu até encontrar esta opção
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Toque em "Adicionar"</p>
                <p className="text-sm text-muted-foreground">
                  O app será instalado na sua tela inicial
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (deferredPrompt) {
    return (
      <Button onClick={handleInstall} variant="outline" size="sm" className="gap-2">
        <Download className="h-4 w-4" />
        Instalar App
      </Button>
    );
  }

  return null;
}

export function NotificationSettings() {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: vapidKey } = trpc.push.getVapidKey.useQuery();
  const { data: preferences, refetch: refetchPreferences } = trpc.push.getPreferences.useQuery();
  
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const unsubscribeMutation = trpc.push.unsubscribe.useMutation();
  const updatePreferencesMutation = trpc.push.updatePreferences.useMutation();
  const sendTestMutation = trpc.push.sendTest.useMutation();

  useEffect(() => {
    // Verificar suporte a push
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);

      // Verificar se já está inscrito
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!vapidKey?.publicKey) {
      toast.error('Erro ao obter chave de notificação');
      return;
    }

    setLoading(true);
    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        toast.error('Permissão de notificação negada');
        return;
      }

      // Registrar service worker se necessário
      const registration = await navigator.serviceWorker.ready;

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey.publicKey),
      });

      // Enviar para o servidor
      const result = await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
        deviceType: getDeviceType(),
        deviceName: navigator.userAgent,
      });

      if (result.success) {
        setIsSubscribed(true);
        toast.success('Notificações ativadas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast.error('Erro ao ativar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeMutation.mutateAsync({ endpoint: subscription.endpoint });
      }

      setIsSubscribed(false);
      toast.success('Notificações desativadas');
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
      toast.error('Erro ao desativar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    try {
      await updatePreferencesMutation.mutateAsync({ [key]: value });
      refetchPreferences();
      toast.success('Preferência atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar preferência');
    }
  };

  const handleSendTest = async () => {
    try {
      const result = await sendTestMutation.mutateAsync();
      if (result.sent > 0) {
        toast.success('Notificação de teste enviada!');
      } else {
        toast.info('Nenhum dispositivo registrado para receber notificações');
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação de teste');
    }
  };

  if (!pushSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações em tempo real sobre suas reservas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status e ação principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Notificações ativadas</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Notificações desativadas</span>
              </>
            )}
          </div>
          <Button
            onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
            variant={isSubscribed ? 'outline' : 'default'}
            disabled={loading}
          >
            {loading ? 'Processando...' : isSubscribed ? 'Desativar' : 'Ativar'}
          </Button>
        </div>

        {/* Botão de teste */}
        {isSubscribed && (
          <Button
            onClick={handleSendTest}
            variant="outline"
            size="sm"
            className="w-full gap-2"
            disabled={sendTestMutation.isPending}
          >
            <Send className="h-4 w-4" />
            Enviar Notificação de Teste
          </Button>
        )}

        {/* Preferências de notificação */}
        {isSubscribed && preferences && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferências
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-enabled" className="flex flex-col gap-1">
                  <span>Notificações Push</span>
                  <span className="text-xs text-muted-foreground">Receber no celular/navegador</span>
                </Label>
                <Switch
                  id="push-enabled"
                  checked={preferences.pushEnabled}
                  onCheckedChange={(v) => handlePreferenceChange('pushEnabled', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled" className="flex flex-col gap-1">
                  <span>Notificações por Email</span>
                  <span className="text-xs text-muted-foreground">Receber por email</span>
                </Label>
                <Switch
                  id="email-enabled"
                  checked={preferences.emailEnabled}
                  onCheckedChange={(v) => handlePreferenceChange('emailEnabled', v)}
                />
              </div>

              <div className="border-t pt-3 space-y-3">
                <p className="text-sm text-muted-foreground">Tipos de notificação:</p>

                <div className="flex items-center justify-between">
                  <Label htmlFor="nova-reserva">Nova reserva criada</Label>
                  <Switch
                    id="nova-reserva"
                    checked={preferences.notificarNovaReserva}
                    onCheckedChange={(v) => handlePreferenceChange('notificarNovaReserva', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmacao">Confirmação de reserva</Label>
                  <Switch
                    id="confirmacao"
                    checked={preferences.notificarConfirmacao}
                    onCheckedChange={(v) => handlePreferenceChange('notificarConfirmacao', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cancelamento">Cancelamento de reserva</Label>
                  <Switch
                    id="cancelamento"
                    checked={preferences.notificarCancelamento}
                    onCheckedChange={(v) => handlePreferenceChange('notificarCancelamento', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="lembrete">Lembretes de reserva</Label>
                  <Switch
                    id="lembrete"
                    checked={preferences.notificarLembrete}
                    onCheckedChange={(v) => handlePreferenceChange('notificarLembrete', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cadastro">Aprovação de cadastro</Label>
                  <Switch
                    id="cadastro"
                    checked={preferences.notificarCadastro}
                    onCheckedChange={(v) => handlePreferenceChange('notificarCadastro', v)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utilitários
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Componente compacto para o header
export function NotificationBell() {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {hasPermission ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
        </DialogHeader>
        <NotificationSettings />
      </DialogContent>
    </Dialog>
  );
}
