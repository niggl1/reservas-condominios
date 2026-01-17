import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";

interface AvaliacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserva: {
    id: number;
    protocolo: string;
    areaId: number;
    areaNome: string;
    moradorId: number;
    condominioId: number;
    dataReserva: string;
  };
  onSuccess?: () => void;
}

export function AvaliacaoModal({
  open,
  onOpenChange,
  reserva,
  onSuccess,
}: AvaliacaoModalProps) {
  const [notaGeral, setNotaGeral] = useState(0);
  const [notaLimpeza, setNotaLimpeza] = useState(0);
  const [notaConservacao, setNotaConservacao] = useState(0);
  const [notaAtendimento, setNotaAtendimento] = useState(0);
  const [comentario, setComentario] = useState("");
  const [recomendaria, setRecomendaria] = useState(true);
  const [problemaReportado, setProblemaReportado] = useState(false);
  const [descricaoProblema, setDescricaoProblema] = useState("");
  const [isPublica, setIsPublica] = useState(true);

  const createMutation = trpc.avaliacoes.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso!");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar avaliação");
    },
  });

  const resetForm = () => {
    setNotaGeral(0);
    setNotaLimpeza(0);
    setNotaConservacao(0);
    setNotaAtendimento(0);
    setComentario("");
    setRecomendaria(true);
    setProblemaReportado(false);
    setDescricaoProblema("");
    setIsPublica(true);
  };

  const handleSubmit = () => {
    if (notaGeral === 0) {
      toast.error("Por favor, dê uma nota geral");
      return;
    }

    createMutation.mutate({
      reservaId: reserva.id,
      moradorId: reserva.moradorId,
      areaId: reserva.areaId,
      condominioId: reserva.condominioId,
      notaGeral,
      notaLimpeza: notaLimpeza || undefined,
      notaConservacao: notaConservacao || undefined,
      notaAtendimento: notaAtendimento || undefined,
      comentario: comentario || undefined,
      recomendaria,
      problemaReportado,
      descricaoProblema: problemaReportado ? descricaoProblema : undefined,
      isPublica,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar Experiência</DialogTitle>
          <DialogDescription>
            Como foi sua experiência na {reserva.areaNome}?
            <br />
            <span className="text-xs">Reserva #{reserva.protocolo} - {reserva.dataReserva}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nota Geral */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Nota Geral *</Label>
            <StarRating
              rating={notaGeral}
              size="lg"
              interactive
              onChange={setNotaGeral}
              showLabel
            />
          </div>

          {/* Notas Específicas */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Limpeza</Label>
              <StarRating
                rating={notaLimpeza}
                size="sm"
                interactive
                onChange={setNotaLimpeza}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Conservação</Label>
              <StarRating
                rating={notaConservacao}
                size="sm"
                interactive
                onChange={setNotaConservacao}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Atendimento</Label>
              <StarRating
                rating={notaAtendimento}
                size="sm"
                interactive
                onChange={setNotaAtendimento}
              />
            </div>
          </div>

          {/* Recomendaria */}
          <div className="space-y-2">
            <Label className="text-sm">Você recomendaria esta área?</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={recomendaria ? "default" : "outline"}
                size="sm"
                onClick={() => setRecomendaria(true)}
                className="flex-1"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Sim
              </Button>
              <Button
                type="button"
                variant={!recomendaria ? "destructive" : "outline"}
                size="sm"
                onClick={() => setRecomendaria(false)}
                className="flex-1"
              >
                <ThumbsDown className="h-4 w-4 mr-2" />
                Não
              </Button>
            </div>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário (opcional)</Label>
            <Textarea
              id="comentario"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
            />
          </div>

          {/* Reportar Problema */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <Label htmlFor="problema" className="text-sm font-medium">
                  Reportar problema
                </Label>
              </div>
              <Switch
                id="problema"
                checked={problemaReportado}
                onCheckedChange={setProblemaReportado}
              />
            </div>
            {problemaReportado && (
              <Textarea
                placeholder="Descreva o problema encontrado..."
                value={descricaoProblema}
                onChange={(e) => setDescricaoProblema(e.target.value)}
                rows={2}
              />
            )}
          </div>

          {/* Avaliação Pública */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="publica" className="text-sm font-medium">
                Avaliação pública
              </Label>
              <p className="text-xs text-muted-foreground">
                Outros moradores poderão ver sua avaliação
              </p>
            </div>
            <Switch
              id="publica"
              checked={isPublica}
              onCheckedChange={setIsPublica}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enviar Avaliação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
