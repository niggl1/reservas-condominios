import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  Users,
  FileWarning,
  Trash2
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface DadosMorador {
  linha: number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  bloco: string;
  unidade: string;
  tipo?: string;
}

interface ValidacaoItem {
  linha: number;
  valido: boolean;
  erros: string[];
}

interface ResultadoItem {
  linha: number;
  sucesso: boolean;
  erro?: string;
  moradorId?: number;
}

interface ImportarMoradoresExcelProps {
  condominioId: number;
  condominioNome: string;
  onSuccess?: () => void;
}

export function ImportarMoradoresExcel({ condominioId, condominioNome, onSuccess }: ImportarMoradoresExcelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dados, setDados] = useState<DadosMorador[]>([]);
  const [validacoes, setValidacoes] = useState<ValidacaoItem[]>([]);
  const [resultados, setResultados] = useState<ResultadoItem[]>([]);
  const [etapa, setEtapa] = useState<'upload' | 'preview' | 'validando' | 'importando' | 'resultado'>('upload');
  const [progresso, setProgresso] = useState(0);

  const validarMutation = trpc.moradores.validarImportacao.useMutation();
  const importarMutation = trpc.moradores.importarExcel.useMutation();

  const resetar = useCallback(() => {
    setArquivo(null);
    setDados([]);
    setValidacoes([]);
    setResultados([]);
    setEtapa('upload');
    setProgresso(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetar();
  }, [resetar]);

  const processarArquivo = useCallback(async (file: File) => {
    // Validar tamanho (máximo 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande', {
        description: 'O arquivo deve ter no máximo 100MB'
      });
      return;
    }

    // Validar extensão
    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(extensao || '')) {
      toast.error('Formato inválido', {
        description: 'Apenas arquivos Excel (.xlsx, .xls) são aceitos'
      });
      return;
    }

    setArquivo(file);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (jsonData.length < 2) {
        toast.error('Arquivo vazio', {
          description: 'O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados'
        });
        return;
      }

      // Identificar colunas pelo cabeçalho
      const cabecalho = (jsonData[0] as string[]).map(c => String(c || '').toLowerCase().trim());
      const colunas = {
        nome: cabecalho.findIndex(c => c.includes('nome')),
        email: cabecalho.findIndex(c => c.includes('email') || c.includes('e-mail')),
        telefone: cabecalho.findIndex(c => c.includes('telefone') || c.includes('celular') || c.includes('fone')),
        cpf: cabecalho.findIndex(c => c.includes('cpf')),
        bloco: cabecalho.findIndex(c => c.includes('bloco') || c.includes('torre')),
        unidade: cabecalho.findIndex(c => c.includes('unidade') || c.includes('apartamento') || c.includes('apto') || c.includes('apt')),
        tipo: cabecalho.findIndex(c => c.includes('tipo')),
      };

      // Validar colunas obrigatórias
      if (colunas.nome === -1 || colunas.email === -1 || colunas.bloco === -1 || colunas.unidade === -1) {
        toast.error('Colunas obrigatórias não encontradas', {
          description: 'O arquivo deve conter as colunas: Nome, Email, Bloco e Unidade'
        });
        return;
      }

      // Processar dados
      const dadosProcessados: DadosMorador[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];
        if (!row || row.length === 0) continue;

        const nome = String(row[colunas.nome] || '').trim();
        const email = String(row[colunas.email] || '').trim();
        const bloco = String(row[colunas.bloco] || '').trim();
        const unidade = String(row[colunas.unidade] || '').trim();

        // Pular linhas vazias
        if (!nome && !email && !bloco && !unidade) continue;

        dadosProcessados.push({
          linha: i + 1,
          nome,
          email,
          telefone: colunas.telefone !== -1 ? String(row[colunas.telefone] || '').trim() || undefined : undefined,
          cpf: colunas.cpf !== -1 ? String(row[colunas.cpf] || '').trim() || undefined : undefined,
          bloco,
          unidade,
          tipo: colunas.tipo !== -1 ? String(row[colunas.tipo] || '').trim() || undefined : undefined,
        });
      }

      if (dadosProcessados.length === 0) {
        toast.error('Nenhum dado encontrado', {
          description: 'O arquivo não contém dados válidos para importar'
        });
        return;
      }

      setDados(dadosProcessados);
      setEtapa('preview');
      toast.success(`${dadosProcessados.length} registros encontrados`);
    } catch (error) {
      toast.error('Erro ao processar arquivo', {
        description: 'Não foi possível ler o arquivo Excel'
      });
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  }, [processarArquivo]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  }, [processarArquivo]);

  const validarDados = useCallback(async () => {
    setEtapa('validando');
    setProgresso(0);

    try {
      const resultado = await validarMutation.mutateAsync({
        condominioId,
        dados,
      });

      setValidacoes(resultado.validacoes);
      setProgresso(100);
      setEtapa('preview');

      if (resultado.invalidos > 0) {
        toast.warning(`${resultado.invalidos} registros com erros`, {
          description: 'Corrija os erros antes de importar'
        });
      } else {
        toast.success('Todos os registros são válidos!');
      }
    } catch (error) {
      toast.error('Erro na validação');
      setEtapa('preview');
    }
  }, [condominioId, dados, validarMutation]);

  const importarDados = useCallback(async () => {
    const dadosValidos = dados.filter((d, i) => {
      const validacao = validacoes.find(v => v.linha === d.linha);
      return !validacao || validacao.valido;
    });

    if (dadosValidos.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }

    setEtapa('importando');
    setProgresso(0);

    try {
      const resultado = await importarMutation.mutateAsync({
        condominioId,
        dados: dadosValidos,
      });

      setResultados(resultado.resultados);
      setProgresso(100);
      setEtapa('resultado');

      if (resultado.erros > 0) {
        toast.warning(`${resultado.sucessos} importados, ${resultado.erros} com erro`);
      } else {
        toast.success(`${resultado.sucessos} moradores importados com sucesso!`);
      }

      onSuccess?.();
    } catch (error) {
      toast.error('Erro na importação');
      setEtapa('preview');
    }
  }, [condominioId, dados, validacoes, importarMutation, onSuccess]);

  const downloadModelo = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nome', 'Email', 'Telefone', 'CPF', 'Bloco', 'Unidade', 'Tipo'],
      ['João Silva', 'joao@email.com', '11999999999', '123.456.789-00', 'A', '101', 'proprietario'],
      ['Maria Santos', 'maria@email.com', '11988888888', '987.654.321-00', 'A', '102', 'inquilino'],
      ['Pedro Oliveira', 'pedro@email.com', '11977777777', '', 'B', '201', 'dependente'],
    ]);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 20 }, // Nome
      { wch: 25 }, // Email
      { wch: 15 }, // Telefone
      { wch: 15 }, // CPF
      { wch: 10 }, // Bloco
      { wch: 10 }, // Unidade
      { wch: 15 }, // Tipo
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Moradores');
    XLSX.writeFile(wb, 'modelo_importacao_moradores.xlsx');
    toast.success('Modelo baixado com sucesso!');
  }, []);

  const totalValidos = validacoes.filter(v => v.valido).length;
  const totalInvalidos = validacoes.filter(v => !v.valido).length;
  const totalSucessos = resultados.filter(r => r.sucesso).length;
  const totalErros = resultados.filter(r => !r.sucesso).length;

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Importar Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              Importar Moradores via Excel
            </DialogTitle>
            <DialogDescription>
              Importe moradores em lote para o condomínio <strong>{condominioNome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {/* Etapa: Upload */}
            {etapa === 'upload' && (
              <div className="space-y-6">
                {/* Área de upload */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer"
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="cursor-pointer">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Arraste o arquivo Excel aqui
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      ou clique para selecionar
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Formatos aceitos: .xlsx, .xls (máx. 100MB)
                    </Badge>
                  </label>
                </div>

                {/* Instruções */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-500" />
                      Instruções
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>O arquivo Excel deve conter as seguintes colunas:</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>
                        <span>Nome</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>
                        <span>Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>
                        <span>Bloco</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-700">Obrigatório</Badge>
                        <span>Unidade</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-600">Opcional</Badge>
                        <span>Telefone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-600">Opcional</Badge>
                        <span>CPF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-600">Opcional</Badge>
                        <span>Tipo (proprietario/inquilino/dependente)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botão download modelo */}
                <Button 
                  variant="outline" 
                  onClick={downloadModelo}
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Modelo de Planilha
                </Button>
              </div>
            )}

            {/* Etapa: Preview */}
            {etapa === 'preview' && (
              <div className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">{dados.length}</p>
                      <p className="text-sm text-blue-600">Total de registros</p>
                    </CardContent>
                  </Card>
                  {validacoes.length > 0 && (
                    <>
                      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                        <CardContent className="p-4 text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-700">{totalValidos}</p>
                          <p className="text-sm text-green-600">Válidos</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                        <CardContent className="p-4 text-center">
                          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-700">{totalInvalidos}</p>
                          <p className="text-sm text-red-600">Com erros</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Tabela de dados */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Preview dos Dados</CardTitle>
                    <CardDescription>
                      {arquivo?.name} • {dados.length} registros
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Linha</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Nome</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Email</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Bloco</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Unidade</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dados.map((item) => {
                            const validacao = validacoes.find(v => v.linha === item.linha);
                            const temErro = validacao && !validacao.valido;
                            return (
                              <tr 
                                key={item.linha} 
                                className={`border-t ${temErro ? 'bg-red-50' : ''}`}
                              >
                                <td className="px-3 py-2 text-gray-500">{item.linha}</td>
                                <td className="px-3 py-2 font-medium">{item.nome || '-'}</td>
                                <td className="px-3 py-2">{item.email || '-'}</td>
                                <td className="px-3 py-2">{item.bloco || '-'}</td>
                                <td className="px-3 py-2">{item.unidade || '-'}</td>
                                <td className="px-3 py-2">
                                  {validacao ? (
                                    validacao.valido ? (
                                      <Badge className="bg-green-100 text-green-700">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Válido
                                      </Badge>
                                    ) : (
                                      <div className="space-y-1">
                                        <Badge className="bg-red-100 text-red-700">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Erro
                                        </Badge>
                                        <div className="text-xs text-red-600">
                                          {validacao.erros.join('; ')}
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500">
                                      Pendente
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetar} className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                  {validacoes.length === 0 ? (
                    <Button 
                      onClick={validarDados} 
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500"
                      disabled={validarMutation.isPending}
                    >
                      {validarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-2" />
                      )}
                      Validar Dados
                    </Button>
                  ) : (
                    <Button 
                      onClick={importarDados} 
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                      disabled={importarMutation.isPending || totalValidos === 0}
                    >
                      {importarMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Importar {totalValidos} Válidos
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Etapa: Validando/Importando */}
            {(etapa === 'validando' || etapa === 'importando') && (
              <div className="py-12 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    {etapa === 'validando' ? 'Validando dados...' : 'Importando moradores...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Por favor, aguarde
                  </p>
                </div>
                <Progress value={progresso} className="w-64 mx-auto" />
              </div>
            )}

            {/* Etapa: Resultado */}
            {etapa === 'resultado' && (
              <div className="space-y-4">
                {/* Resumo final */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-green-700">{totalSucessos}</p>
                      <p className="text-sm text-green-600">Importados com sucesso</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6 text-center">
                      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-red-700">{totalErros}</p>
                      <p className="text-sm text-red-600">Com erro</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de erros */}
                {totalErros > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-red-700 flex items-center gap-2">
                        <FileWarning className="w-5 h-5" />
                        Registros com erro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-4 space-y-2">
                          {resultados.filter(r => !r.sucesso).map((item) => {
                            const dado = dados.find(d => d.linha === item.linha);
                            return (
                              <div 
                                key={item.linha}
                                className="flex items-start gap-3 p-3 bg-red-50 rounded-lg"
                              >
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-gray-700">
                                    Linha {item.linha}: {dado?.nome || 'Sem nome'}
                                  </p>
                                  <p className="text-sm text-red-600">{item.erro}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                <Button onClick={handleClose} className="w-full">
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
