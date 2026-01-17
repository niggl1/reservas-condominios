import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating, RatingDisplay } from "@/components/StarRating";
import { AvaliacaoModal } from "@/components/AvaliacaoModal";
import { trpc } from "@/lib/trpc";
import { Star, MessageSquare, AlertTriangle, ThumbsUp, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Avaliacoes() {
  const [selectedReserva, setSelectedReserva] = useState<any>(null);
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);
  const [respostaModalOpen, setRespostaModalOpen] = useState(false);
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<any>(null);
  const [resposta, setResposta] = useState("");

  const { data: user } = trpc.auth.me.useQuery();
  const { data: morador } = trpc.moradores.getByUserId.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const { data: pendentes = [], refetch: refetchPendentes } = trpc.avaliacoes.pendentes.useQuery(
    { moradorId: morador?.id ?? 0 },
    { enabled: !!morador?.id }
  );

  const { data: avaliacoes = [], refetch: refetchAvaliacoes } = trpc.avaliacoes.listByCondominio.useQuery(
    { condominioId: morador?.condominioId ?? 0 },
    { enabled: !!morador?.condominioId }
  );

  const responderMutation = trpc.avaliacoes.responder.useMutation({
    onSuccess: () => {
      toast.success("Resposta enviada com sucesso!");
      setRespostaModalOpen(false);
      setResposta("");
      refetchAvaliacoes();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar resposta");
    },
  });

  const handleAvaliar = (reserva: any) => {
    setSelectedReserva({
      id: reserva.id,
      protocolo: reserva.protocolo,
      areaId: reserva.areaId,
      areaNome: reserva.areaNome,
      moradorId: morador?.id,
      condominioId: morador?.condominioId,
      dataReserva: format(new Date(reserva.dataReserva), "dd/MM/yyyy"),
    });
    setAvaliacaoModalOpen(true);
  };

  const handleResponder = (avaliacao: any) => {
    setSelectedAvaliacao(avaliacao);
    setRespostaModalOpen(true);
  };

  const submitResposta = () => {
    if (!resposta.trim()) {
      toast.error("Digite uma resposta");
      return;
    }
    responderMutation.mutate({
      id: selectedAvaliacao.id,
      resposta: resposta.trim(),
    });
  };

  const isSindico = user?.role === "sindico" || user?.role === "super_admin";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6" />
            Avaliações
          </h1>
          <p className="text-muted-foreground">
            Avalie suas experiências e veja o que outros moradores acharam
          </p>
        </div>

        <Tabs defaultValue="pendentes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendentes" className="relative">
              Pendentes
              {pendentes.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {pendentes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="todas">Todas Avaliações</TabsTrigger>
          </TabsList>

          {/* Pendentes */}
          <TabsContent value="pendentes" className="space-y-4">
            {pendentes.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <ThumbsUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Você não tem avaliações pendentes
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendentes.map((reserva: any) => (
                  <Card key={reserva.id} className="premium-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{reserva.areaNome}</CardTitle>
                        <span className="badge-info text-xs">#{reserva.protocolo}</span>
                      </div>
                      <CardDescription>
                        {format(new Date(reserva.dataReserva), "dd/MM/yyyy")} • {reserva.horaInicio} - {reserva.horaFim}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full" 
                        onClick={() => handleAvaliar(reserva)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Avaliar Experiência
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Todas Avaliações */}
          <TabsContent value="todas" className="space-y-4">
            {avaliacoes.length === 0 ? (
              <Card className="premium-card">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma avaliação encontrada
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {avaliacoes.map((avaliacao: any) => (
                  <Card key={avaliacao.id} className="premium-card">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium">{avaliacao.areaNome}</p>
                          <p className="text-sm text-muted-foreground">
                            por {avaliacao.moradorNome} • {format(new Date(avaliacao.createdAt), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <RatingDisplay rating={avaliacao.notaGeral} size="sm" />
                      </div>

                      {/* Notas Específicas */}
                      {(avaliacao.notaLimpeza || avaliacao.notaConservacao || avaliacao.notaAtendimento) && (
                        <div className="flex gap-4 mb-4 text-sm">
                          {avaliacao.notaLimpeza && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Limpeza:</span>
                              <StarRating rating={avaliacao.notaLimpeza} size="sm" />
                            </div>
                          )}
                          {avaliacao.notaConservacao && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Conservação:</span>
                              <StarRating rating={avaliacao.notaConservacao} size="sm" />
                            </div>
                          )}
                          {avaliacao.notaAtendimento && (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Atendimento:</span>
                              <StarRating rating={avaliacao.notaAtendimento} size="sm" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Comentário */}
                      {avaliacao.comentario && (
                        <p className="text-sm mb-4 p-3 bg-muted/50 rounded-lg">
                          "{avaliacao.comentario}"
                        </p>
                      )}

                      {/* Problema Reportado */}
                      {avaliacao.problemaReportado && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg mb-4">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              Problema reportado
                            </p>
                            {avaliacao.descricaoProblema && (
                              <p className="text-sm text-amber-700 dark:text-amber-300">
                                {avaliacao.descricaoProblema}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resposta do Síndico */}
                      {avaliacao.respondida && avaliacao.respostaSindico && (
                        <div className="p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                          <p className="text-xs text-muted-foreground mb-1">
                            Resposta do síndico • {format(new Date(avaliacao.dataResposta), "dd/MM/yyyy")}
                          </p>
                          <p className="text-sm">{avaliacao.respostaSindico}</p>
                        </div>
                      )}

                      {/* Botão Responder (apenas síndico) */}
                      {isSindico && !avaliacao.respondida && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => handleResponder(avaliacao)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Responder
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Avaliação */}
      {selectedReserva && (
        <AvaliacaoModal
          open={avaliacaoModalOpen}
          onOpenChange={setAvaliacaoModalOpen}
          reserva={selectedReserva}
          onSuccess={() => {
            refetchPendentes();
            refetchAvaliacoes();
          }}
        />
      )}

      {/* Modal de Resposta */}
      <Dialog open={respostaModalOpen} onOpenChange={setRespostaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Sua resposta será visível para todos os moradores
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Digite sua resposta..."
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespostaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitResposta} disabled={responderMutation.isPending}>
              {responderMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
