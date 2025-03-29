"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { Github } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(false)
  
  // Separate state for each form type to avoid issues with shared state
  const [formData, setFormData] = useState({
    signin: { email: "", password: "" },
    signup: { email: "", password: "" },
    magic: { email: "" }
  })
  
  // Update form data based on the active tab
  const updateFormData = (tab: keyof typeof formData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }))
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { email, password } = formData.signin
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Success!",
        description: "You have been signed in.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { email, password } = formData.signup
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link.",
      })
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { email } = formData.magic
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast({
        title: "Check your email",
        description: "We've sent you a magic link.",
      })
    } catch (error: any) {
      toast({
        title: "Error sending magic link",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: "github") => {
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Syncora</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <Button 
              variant="outline" 
              onClick={() => handleOAuthSignIn("github")} 
              disabled={loading} 
              className="w-full flex items-center justify-center"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="magic">Magic Link</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="signin-email"
                      placeholder="Email"
                      type="email"
                      value={formData.signin.email}
                      onChange={(e) => updateFormData("signin", "email", e.target.value)}
                      required
                      className="w-full"
                    />
                    <Input
                      id="signin-password"
                      placeholder="Password"
                      type="password"
                      value={formData.signin.password}
                      onChange={(e) => updateFormData("signin", "password", e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="signup-email"
                      placeholder="Email"
                      type="email"
                      value={formData.signup.email}
                      onChange={(e) => updateFormData("signup", "email", e.target.value)}
                      required
                      className="w-full"
                    />
                    <Input
                      id="signup-password"
                      placeholder="Password"
                      type="password"
                      value={formData.signup.password}
                      onChange={(e) => updateFormData("signup", "password", e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing up..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="magic" className="mt-0">
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      id="magic-email"
                      placeholder="Email"
                      type="email"
                      value={formData.magic.email}
                      onChange={(e) => updateFormData("magic", "email", e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Magic Link"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}