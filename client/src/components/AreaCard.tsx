import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, DollarSign } from "lucide-react";

// Mapeamento de ícones por tipo de área
const areaIcons: Record<string, string> = {
  piscina: "/icons/piscina.png",
  churrasqueira: "/icons/churrasqueira.png",
  "salao-festas": "/icons/salao-festas.png",
  "salao de festas": "/icons/salao-festas.png",
  academia: "/icons/academia.png",
  playground: "/icons/playground.png",
  "quadra-esportes": "/icons/quadra-esportes.png",
  quadra: "/icons/quadra-esportes.png",
  sauna: "/icons/sauna.png",
  "espaco-gourmet": "/icons/espaco-gourmet.png",
  gourmet: "/icons/espaco-gourmet.png",
  "sala-jogos": "/icons/sala-jogos.png",
  jogos: "/icons/sala-jogos.png",
};

function getAreaIcon(nome: string): string {
  const normalizedName = nome.toLowerCase().trim();
  
  // Tenta encontrar correspondência exata
  if (areaIcons[normalizedName]) {
    return areaIcons[normalizedName];
  }
  
  // Tenta encontrar correspondência parcial
  for (const [key, icon] of Object.entries(areaIcons)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon;
    }
  }
  
  // Retorna ícone padrão
  return "/icons/area-default.png";
}

interface AreaCardProps {
  area: {
    id: number;
    nome: string;
    descricao?: string | null;
    capacidadeMaxima?: number | null;
    valor?: string | null;
    confirmacaoAutomatica?: boolean | null;
    icone?: string | null;
    fotoUrl?: string | null;
  };
  onClick?: () => void;
  selected?: boolean;
}

export function AreaCard({ area, onClick, selected }: AreaCardProps) {
  const iconUrl = area.icone || getAreaIcon(area.nome);
  const hasPhoto = area.fotoUrl && area.fotoUrl.length > 0;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
        selected ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Ícone 3D Cartoon */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center overflow-hidden">
              <img 
                src={iconUrl} 
                alt={area.nome}
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icons/area-default.png";
                }}
              />
            </div>
            {hasPhoto && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white text-xs">📷</span>
              </div>
            )}
          </div>
          
          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate">
              {area.nome}
            </h3>
            
            {area.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {area.descricao}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-3">
              {area.capacidadeMaxima && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {area.capacidadeMaxima} pessoas
                </Badge>
              )}
              
              {area.valor && parseFloat(area.valor) > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200 bg-green-50">
                  <DollarSign className="h-3 w-3" />
                  R$ {parseFloat(area.valor).toFixed(2)}
                </Badge>
              )}
              
              {area.confirmacaoAutomatica && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Confirmação Automática
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para grid de áreas
interface AreaGridProps {
  areas: AreaCardProps['area'][];
  selectedId?: number;
  onSelect?: (area: AreaCardProps['area']) => void;
}

export function AreaGrid({ areas, selectedId, onSelect }: AreaGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {areas.map((area) => (
        <AreaCard
          key={area.id}
          area={area}
          selected={selectedId === area.id}
          onClick={() => onSelect?.(area)}
        />
      ))}
    </div>
  );
}

export default AreaCard;
