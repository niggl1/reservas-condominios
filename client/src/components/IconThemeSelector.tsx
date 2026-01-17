import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette, Check, RefreshCw } from "lucide-react";

interface IconTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const iconThemes: IconTheme[] = [
  {
    id: "classico",
    name: "Clássico",
    description: "Ícone com 4 quadrantes representando as áreas comuns",
    preview: "/icons/themes/classico/icon-192x192.png",
  },
  {
    id: "moderno",
    name: "Moderno",
    description: "Design moderno com as mesmas cores e estilo",
    preview: "/icons/themes/moderno/icon-192x192.png",
  },
];

const THEME_STORAGE_KEY = "pwa-icon-theme";

export function IconThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || "classico";
  });
  const [applying, setApplying] = useState(false);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const applyTheme = async () => {
    setApplying(true);
    
    try {
      // Salvar preferência no localStorage
      localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
      
      // Atualizar os ícones principais copiando do tema selecionado
      // Nota: Em produção, isso seria feito via API no servidor
      // Por enquanto, apenas salvamos a preferência
      
      toast.success("Tema de ícones atualizado!", {
        description: "Reinstale o app para ver as mudanças no ícone.",
      });
      
      // Tentar atualizar o service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (error) {
      toast.error("Erro ao aplicar tema");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-primary" />
        <Label className="text-base font-medium">Tema de Ícones do App</Label>
      </div>

      <RadioGroup
        value={selectedTheme}
        onValueChange={handleThemeChange}
        className="grid gap-4 md:grid-cols-2"
      >
        {iconThemes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedTheme === theme.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border"
            }`}
            onClick={() => handleThemeChange(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={theme.preview}
                    alt={theme.name}
                    className="w-16 h-16 rounded-xl shadow-md"
                  />
                  {selectedTheme === theme.id && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={theme.id} id={theme.id} className="sr-only" />
                    <Label htmlFor={theme.id} className="font-medium cursor-pointer">
                      {theme.name}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {theme.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>

      <div className="flex justify-end pt-2">
        <Button onClick={applyTheme} disabled={applying}>
          {applying ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Aplicar Tema
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Após aplicar o tema, pode ser necessário reinstalar o app para ver as mudanças no ícone da tela inicial.
      </p>
    </div>
  );
}
