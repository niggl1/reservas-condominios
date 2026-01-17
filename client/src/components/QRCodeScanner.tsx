import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, QrCode, Search, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

interface QRCodeData {
  type: string;
  protocolo: string;
  reservaId: number;
  areaNome: string;
  dataReserva: string;
  horaInicio: string;
  horaFim: string;
  timestamp: number;
}

interface CheckinResult {
  success: boolean;
  message: string;
  reserva?: {
    protocolo: string;
    areaNome: string;
    moradorNome: string;
    dataReserva: string;
    horaInicio: string;
    horaFim: string;
    status: string;
  };
}

export function QRCodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualProtocolo, setManualProtocolo] = useState("");
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkinMutation = trpc.reservas.checkin.useMutation({
    onSuccess: (data) => {
      setCheckinResult({
        success: true,
        message: "Check-in realizado com sucesso!",
        reserva: data.reserva
      });
      toast.success("Check-in realizado com sucesso!");
    },
    onError: (error) => {
      setCheckinResult({
        success: false,
        message: error.message || "Erro ao realizar check-in"
      });
      toast.error(error.message || "Erro ao realizar check-in");
    }
  });

  const buscarReservaMutation = trpc.reservas.getByProtocolo.useMutation({
    onSuccess: (data) => {
      if (data) {
        setCheckinResult({
          success: true,
          message: "Reserva encontrada",
          reserva: {
            protocolo: data.protocolo,
            areaNome: data.area?.nome || "Área",
            moradorNome: data.morador?.nome || "Morador",
            dataReserva: format(new Date(data.dataReserva), "dd/MM/yyyy"),
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
            status: data.status
          }
        });
      } else {
        setCheckinResult({
          success: false,
          message: "Reserva não encontrada"
        });
      }
    },
    onError: (error) => {
      setCheckinResult({
        success: false,
        message: error.message || "Erro ao buscar reserva"
      });
    }
  });

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        scanQRCode();
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      toast.error("Não foi possível acessar a câmera");
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const scan = async () => {
      if (!isScanning || !video.videoWidth) {
        requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        // Usar BarcodeDetector se disponível (Chrome/Edge)
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['qr_code']
          });
          const barcodes = await barcodeDetector.detect(canvas);
          
          if (barcodes.length > 0) {
            const qrData = barcodes[0].rawValue;
            handleQRCodeDetected(qrData);
            return;
          }
        }
      } catch (error) {
        // BarcodeDetector não disponível, continuar scanning
      }

      requestAnimationFrame(scan);
    };

    requestAnimationFrame(scan);
  };

  const handleQRCodeDetected = (data: string) => {
    stopScanning();
    setIsProcessing(true);

    try {
      const qrData: QRCodeData = JSON.parse(data);
      
      if (qrData.type === "reserva_checkin" && qrData.protocolo) {
        // Realizar check-in
        checkinMutation.mutate({ protocolo: qrData.protocolo });
      } else {
        setCheckinResult({
          success: false,
          message: "QR Code inválido"
        });
      }
    } catch (error) {
      setCheckinResult({
        success: false,
        message: "QR Code inválido ou corrompido"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSearch = () => {
    if (!manualProtocolo.trim()) {
      toast.error("Digite o protocolo da reserva");
      return;
    }
    
    setIsProcessing(true);
    buscarReservaMutation.mutate({ protocolo: manualProtocolo.trim().toUpperCase() });
    setIsProcessing(false);
  };

  const handleConfirmCheckin = () => {
    if (checkinResult?.reserva?.protocolo) {
      checkinMutation.mutate({ protocolo: checkinResult.reserva.protocolo });
    }
  };

  const resetScanner = () => {
    setCheckinResult(null);
    setManualProtocolo("");
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          Scanner de Check-in
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code ou digite o protocolo da reserva
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resultado do Check-in */}
        {checkinResult && (
          <div className={`p-4 rounded-xl border ${
            checkinResult.success 
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
              : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          }`}>
            <div className="flex items-start gap-3">
              {checkinResult.success ? (
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  checkinResult.success 
                    ? "text-emerald-800 dark:text-emerald-200" 
                    : "text-red-800 dark:text-red-200"
                }`}>
                  {checkinResult.message}
                </p>
                
                {checkinResult.reserva && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p><strong>Protocolo:</strong> {checkinResult.reserva.protocolo}</p>
                    <p><strong>Área:</strong> {checkinResult.reserva.areaNome}</p>
                    <p><strong>Morador:</strong> {checkinResult.reserva.moradorNome}</p>
                    <p><strong>Data:</strong> {checkinResult.reserva.dataReserva}</p>
                    <p><strong>Horário:</strong> {checkinResult.reserva.horaInicio} - {checkinResult.reserva.horaFim}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 ${
                        checkinResult.reserva.status === 'confirmada' ? 'text-emerald-600' :
                        checkinResult.reserva.status === 'utilizada' ? 'text-blue-600' :
                        checkinResult.reserva.status === 'pendente' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {checkinResult.reserva.status}
                      </span>
                    </p>
                    
                    {checkinResult.reserva.status === 'confirmada' && !checkinResult.message.includes("Check-in realizado") && (
                      <Button 
                        className="mt-2 w-full"
                        onClick={handleConfirmCheckin}
                        disabled={checkinMutation.isPending}
                      >
                        {checkinMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirmar Check-in
                      </Button>
                    )}
                    
                    {checkinResult.reserva.status === 'pendente' && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-800 dark:text-amber-200 text-xs">
                          Reserva pendente de aprovação
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={resetScanner}
            >
              Nova Leitura
            </Button>
          </div>
        )}

        {/* Scanner e Busca Manual */}
        {!checkinResult && (
          <>
            {/* Scanner de Câmera */}
            <div className="space-y-3">
              {isScanning ? (
                <div className="relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className="w-full rounded-xl"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-primary rounded-xl" />
                  </div>
                  <Button 
                    variant="destructive" 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    onClick={stopScanning}
                  >
                    Parar Scanner
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full h-32 flex flex-col gap-2"
                  variant="outline"
                  onClick={startScanning}
                >
                  <Camera className="h-8 w-8" />
                  <span>Abrir Câmera para Escanear</span>
                </Button>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Busca Manual */}
            <div className="space-y-3">
              <Label htmlFor="protocolo">Buscar por Protocolo</Label>
              <div className="flex gap-2">
                <Input
                  id="protocolo"
                  placeholder="Ex: ABC123"
                  value={manualProtocolo}
                  onChange={(e) => setManualProtocolo(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase"
                />
                <Button 
                  onClick={handleManualSearch}
                  disabled={isProcessing || buscarReservaMutation.isPending}
                >
                  {buscarReservaMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
