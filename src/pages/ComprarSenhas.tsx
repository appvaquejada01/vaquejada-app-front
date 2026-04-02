import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ArrowLeft, ShoppingCart } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const ComprarSenhas = () => {
  const { id } = useParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  const categorias = [
    { id: "amador", nome: "Amador", preco: 150, vagas: 50, ocupadas: 8 },
    { id: "profissional", nome: "Profissional", preco: 200, vagas: 40, ocupadas: 12 },
    { id: "aspirante", nome: "Aspirante", preco: 120, vagas: 50, ocupadas: 15 },
    { id: "mirim", nome: "Mirim", preco: 100, vagas: 30, ocupadas: 12 },
  ];

  const categoria = categorias.find(c => c.id === selectedCategory);

  const generateNumbers = () => {
    if (!categoria) return [];
    const numbers = [];
    for (let i = 1; i <= categoria.vagas; i++) {
      const isOccupied = i <= categoria.ocupadas;
      numbers.push({ number: i, occupied: isOccupied });
    }
    return numbers;
  };

  const toggleNumber = (num: number) => {
    setSelectedNumbers(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleCheckout = () => {
    if (selectedNumbers.length === 0) {
      toast.error("Selecione pelo menos uma senha");
      return;
    }
    toast.success(`${selectedNumbers.length} senha(s) adicionada(s) ao carrinho!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/evento/${id}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Vaquei Fácil</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Comprar Senhas</h2>
          <p className="text-muted-foreground mb-8">Vaquejada do Parque Santa Cruz - 15/04/2025</p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {!selectedCategory ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Selecione a categoria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorias.map((cat) => (
                      <Card 
                        key={cat.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <CardHeader>
                          <CardTitle>{cat.nome}</CardTitle>
                          <CardDescription className="text-2xl font-bold text-primary">
                            R$ {cat.preco},00
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="secondary">
                            {cat.vagas - cat.ocupadas} vagas disponíveis
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Categoria: {categoria?.nome}</h3>
                      <p className="text-muted-foreground">
                        R$ {categoria?.preco},00 por senha
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setSelectedCategory(null);
                      setSelectedNumbers([]);
                    }}>
                      Trocar categoria
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Mapa de Senhas</CardTitle>
                      <CardDescription>
                        Selecione os números desejados ({selectedNumbers.length} selecionadas)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                        {generateNumbers().map(({ number, occupied }) => (
                          <button
                            key={number}
                            onClick={() => !occupied && toggleNumber(number)}
                            disabled={occupied}
                            className={`
                              aspect-square rounded-lg border-2 font-semibold text-sm
                              transition-all
                              ${occupied 
                                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                                : selectedNumbers.includes(number)
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-accent hover:border-accent-foreground cursor-pointer'
                              }
                            `}
                          >
                            {number}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-4 mt-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border-2 bg-background"></div>
                          <span>Disponível</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border-2 bg-primary"></div>
                          <span>Selecionada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded border-2 bg-muted opacity-50"></div>
                          <span>Ocupada</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedCategory && categoria ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Categoria:</span>
                          <span className="font-medium">{categoria.nome}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Senhas selecionadas:</span>
                          <span className="font-medium">{selectedNumbers.length}</span>
                        </div>
                        {selectedNumbers.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Números: {selectedNumbers.sort((a, b) => a - b).join(", ")}
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor unitário:</span>
                          <span className="font-medium">R$ {categoria.preco},00</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-bold text-primary">
                            R$ {(categoria.preco * selectedNumbers.length).toFixed(2)}
                          </span>
                        </div>

                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleCheckout}
                          disabled={selectedNumbers.length === 0}
                        >
                          Finalizar compra
                        </Button>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Checkbox id="terms" />
                        <label htmlFor="terms">
                          Li e concordo com o regulamento do evento
                        </label>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Selecione uma categoria para começar
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprarSenhas;
