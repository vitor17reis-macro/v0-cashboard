import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <Mail className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle className="font-serif text-2xl">Verifique o seu email</CardTitle>
            <CardDescription>
              Enviámos um link de confirmação para o seu email. Por favor, clique no link para ativar a sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Após verificar o email, poderá fazer login.</p>
            <Link href="/auth/login" className="text-sm text-emerald-500 hover:underline">
              Voltar ao Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
