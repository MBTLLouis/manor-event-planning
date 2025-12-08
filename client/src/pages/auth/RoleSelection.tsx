import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart } from "lucide-react";
import { useLocation } from "wouter";

export default function RoleSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 font-elegant">Manor By The Lake</h1>
          <p className="text-xl text-muted-foreground">Event Planning Portal</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50"
                onClick={() => setLocation("/login/employee")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Employee Login</CardTitle>
              <CardDescription className="text-base">
                Access staff dashboard and event management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full" size="lg">
                Continue as Employee
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-accent/50"
                onClick={() => setLocation("/login/couple")}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Heart className="w-10 h-10 text-accent" />
              </div>
              <CardTitle className="text-2xl">Couple Login</CardTitle>
              <CardDescription className="text-base">
                View your event details and planning progress
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                Continue as Couple
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
