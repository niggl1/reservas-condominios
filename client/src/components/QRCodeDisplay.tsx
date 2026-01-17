import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  protocolo: string;
  reservaId: number;
  areaNome: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
}

export function QRCodeDisplay({ 
  protocolo, 
  reservaId, 
  areaNome, 
  dataReserva, 
  horaInicio, 
  horaFim 
}: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dados codificados no QR Code
  const qrData = JSON.stringify({
    type: "reserva_checkin",
    protocolo,
    reservaId,
    areaNome,
    dataReserva,
    horaInicio,
    horaFim,
    timestamp: Date.now()
  });

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Usar API de geração de QR Code
        const QRCode = await import('qrcode');
        const url = await QRCode.toDataURL(qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#0d9488',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        toast.error('Erro ao gerar QR Code');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRCode();
  }, [qrData]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.download = `reserva-${protocolo}-qrcode.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR Code baixado com sucesso');
  };

  const handleShare = async () => {
    if (!qrCodeUrl) return;

    try {
      // Converter data URL para blob
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const file = new File([blob], `reserva-${protocolo}-qrcode.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `QR Code - Reserva #${protocolo}`,
          text: `QR Code para check-in da reserva ${areaNome} em ${dataReserva}`,
          files: [file]
        });
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(`Reserva #${protocolo} - ${areaNome} - ${dataReserva} ${horaInicio}-${horaFim}`);
        toast.success('Informações copiadas para a área de transferência');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao compartilhar');
    }
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          QR Code para Check-in
        </CardTitle>
        <CardDescription>
          Apresente este código na portaria para realizar o check-in
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="w-64 h-64 flex items-center justify-center bg-muted/50 rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : qrCodeUrl ? (
          <>
            <div className="p-4 bg-white rounded-xl shadow-inner">
              <img 
                src={qrCodeUrl} 
                alt={`QR Code da reserva ${protocolo}`}
                className="w-56 h-56"
              />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Protocolo: <span className="font-mono font-bold text-foreground">{protocolo}</span>
            </p>
            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </>
        ) : (
          <div className="w-64 h-64 flex items-center justify-center bg-muted/50 rounded-xl">
            <p className="text-muted-foreground">Erro ao gerar QR Code</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
