"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Shield, Sparkles, Code, FileText, ChevronRight, ArrowRight } from "lucide-react"

// Custom cursor component
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hidden, setHidden] = useState(true)
  const [clicked, setClicked] = useState(false)
  const [linkHovered, setLinkHovered] = useState(false)

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setHidden(false)
    }

    const handleMouseDown = () => setClicked(true)
    const handleMouseUp = () => setClicked(false)

    const handleLinkHoverStart = () => setLinkHovered(true)
    const handleLinkHoverEnd = () => setLinkHovered(false)

    window.addEventListener("mousemove", updatePosition)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mouseleave", () => setHidden(true))
    window.addEventListener("mouseenter", () => setHidden(false))

    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", handleLinkHoverStart)
      el.addEventListener("mouseleave", handleLinkHoverEnd)
    })

    return () => {
      window.removeEventListener("mousemove", updatePosition)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mouseleave", () => setHidden(true))
      window.removeEventListener("mouseenter", () => setHidden(false))

      document.querySelectorAll("a, button").forEach((el) => {
        el.removeEventListener("mouseenter", handleLinkHoverStart)
        el.removeEventListener("mouseleave", handleLinkHoverEnd)
      })
    }
  }, [])

  const springConfig = { damping: 25, stiffness: 300 }
  const cursorX = useSpring(position.x, springConfig)
  const cursorY = useSpring(position.y, springConfig)

  return (
    <AnimatePresence>
      {!hidden && (
        <>
          <motion.div
            className="cursor-dot pointer-events-none fixed z-50 h-3 w-3 rounded-full bg-primary"
            style={{
              x: cursorX,
              y: cursorY,
              scale: clicked ? 0.8 : 1,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: clicked ? 0.8 : 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className={`cursor-ring pointer-events-none fixed z-50 h-8 w-8 rounded-full border-2 ${
              linkHovered ? "border-white bg-primary/20" : "border-primary"
            }`}
            style={{
              x: cursorX,
              y: cursorY,
              scale: linkHovered ? 1.5 : clicked ? 1.2 : 1,
            }}
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 0.5, scale: linkHovered ? 1.5 : clicked ? 1.2 : 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.2 }}
          />
        </>
      )}
    </AnimatePresence>
  )
}

// Parallax section component
const ParallaxSection = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <motion.section ref={ref} style={{ y }} className={`relative ${className}`} id={id}>
      {children}
    </motion.section>
  )
}

// Animated text reveal component
const AnimatedText = ({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) => {
  return (
    <motion.span
      className={`inline-block ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
    >
      {text}
    </motion.span>
  )
}

// Animated feature card component
interface FeatureCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      className="group relative flex flex-col items-center space-y-4 rounded-xl border border-transparent bg-gradient-to-br from-background to-muted p-6 shadow-lg transition-all hover:border-primary/20 hover:shadow-xl"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
    >
      <motion.div
        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100"
        initial={{ scale: 0.8 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
      />
      <motion.div
        className="rounded-full bg-primary/10 p-3"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="h-6 w-6 text-primary" />
      </motion.div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-center text-muted-foreground">{description}</p>
    </motion.div>
  )
}

// Animated button component
const AnimatedButton = ({ children, variant = "default", className = "", href = "#", ...props }: { children: React.ReactNode; variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"; className?: string; href?: string; [key: string]: any }) => {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button variant={variant} className={`relative overflow-hidden ${className}`} {...props}>
          <motion.span className="relative z-10 flex items-center gap-2" initial={{ x: 0 }} whileHover={{ x: -4 }}>
            {children}
          </motion.span>
          <motion.span
            className="absolute inset-0 z-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0"
            initial={{ x: "-100%", opacity: 0 }}
            whileHover={{ x: "100%", opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
        </Button>
      </motion.div>
    </Link>
  )
}

// Scroll progress indicator
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  return <motion.div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary origin-left" style={{ scaleX }} />
}

export default function Home() {
  const { scrollYProgress } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-background via-background to-background/95">
      <CustomCursor />
      <ScrollProgress />

      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-[30%] -right-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute top-[40%] -left-[10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute -bottom-[20%] right-[20%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]"
          animate={{
            x: [0, 40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        className={`sticky top-0 z-30 flex h-20 items-center backdrop-blur transition-all ${
          scrolled ? "border-b bg-background/80 supports-[backdrop-filter]:bg-background/60" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="container flex flex-1 items-center justify-between px-4 md:px-6">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <MessageSquare className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h1
              className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent"
              initial={{ letterSpacing: "0em" }}
              whileHover={{ letterSpacing: "0.05em" }}
              transition={{ duration: 0.3 }}
            >
              Syncora
            </motion.h1>
          </motion.div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-8">
              {["Features", "AI Features", "Teams"].map((item, i) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <motion.span initial={{ y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    {item}
                  </motion.span>
                  <motion.span
                    className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <AnimatedButton variant="ghost" href="/login">
                Login
              </AnimatedButton>
              <AnimatedButton href="/signup" className="group">
                <span>Sign Up</span>
                <motion.span
                  initial={{ x: 0, opacity: 0.8 }}
                  whileHover={{ x: 4, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="ml-1 h-4 w-4" />
                </motion.span>
              </AnimatedButton>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex min-h-[90vh] w-full items-center overflow-hidden py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                      Redefining Team Collaboration
                    </span>
                  </motion.div>
                  <h1 className="space-y-4 text-4xl font-bold tracking-tight sm:text-6xl xl:text-7xl/none">
                 
                    <AnimatedText text="Structured" className="block" delay={0.1} />
                    <AnimatedText text="Collaboration for" className="block" delay={0.2} />
                    <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-transparent bg-clip-text">
                    <AnimatedText
                      text="Modern Teams"
                      className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-transparent bg-clip-text"
                      delay={0.3}
                      
                    />
                    </span>
                  </h1>
                  <motion.p
                    className="max-w-[600px] text-xl text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    A modular, component-based messaging platform designed for teams of all technical levels, powered by
                    AI.
                  </motion.p>
                </div>
                <motion.div
                  className="flex flex-col gap-4 sm:flex-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  <AnimatedButton size="lg" className="group" href="/signup">
                    <span>Get Started</span>
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </motion.span>
                  </AnimatedButton>
                  <AnimatedButton size="lg" variant="outline" href="#features">
                    Learn More
                  </AnimatedButton>
                </motion.div>
              </div>
              <motion.div
                className="hidden lg:block"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <div className="relative h-full">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/40 blur-3xl"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.6, 0.5],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "reverse",
                    }}
                  />
                  <motion.div
                    className="relative rounded-2xl border bg-card/80 p-6 shadow-2xl backdrop-blur-sm"
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-center gap-2 border-b pb-3">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <div className="ml-2 text-sm font-medium">Syncora Collaboration</div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">TS</span>
                        </div>
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <p>Hey team, I just pushed the new API changes. Can someone review?</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-500">JD</span>
                        </div>
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <p>I'll take a look. What endpoints did you modify?</p>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">TS</span>
                        </div>
                        <div className="rounded-lg bg-muted p-3 text-sm">
                          <p>The user authentication flow and profile endpoints.</p>
                          <div className="mt-2 rounded bg-background p-2 font-mono text-xs">
                            <pre>POST /api/auth/login</pre>
                            <pre>GET /api/users/:id/profile</pre>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                      >
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-500">AI</span>
                        </div>
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm">
                          <p className="mb-1 text-xs font-medium text-green-500">
                            AI Translation for Non-Technical Team Members:
                          </p>
                          <p>Tom has updated how users log in and view their profile information.</p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </section>

        {/* Features Section */}
        <ParallaxSection id="features" className="w-full py-24 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Core Features
              </motion.div>
              <div className="space-y-2">
                <h2 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-4xl font-bold tracking-tighter text-transparent sm:text-5xl text-blue-200">
                  Everything You Need to Collaborate
                </h2>
                <p className="mx-auto max-w-[900px] text-xl text-muted-foreground">
                  Our platform is built with a component-based architecture, making it modular, scalable, and optimized
                  for performance.
                </p>
              </div>
            </motion.div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-16 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={MessageSquare}
                title="Real-time Messaging"
                description="Instant communication with support for rich text, code snippets, and file sharing."
                delay={0.1}
              />
              <FeatureCard
                icon={Users}
                title="Team Management"
                description="Create and manage teams with role-based permissions and dedicated channels."
                delay={0.2}
              />
              <FeatureCard
                icon={Sparkles}
                title="AI-Powered Features"
                description="Smart summaries, technical translations, and sentiment analysis to enhance communication."
                delay={0.3}
              />
              <FeatureCard
                icon={Code}
                title="Code Sharing"
                description="Share and explain code with syntax highlighting and AI-powered explanations."
                delay={0.4}
              />
              <FeatureCard
                icon={FileText}
                title="File Sharing"
                description="Drag and drop file uploads with preview support for images, PDFs, and documents."
                delay={0.5}
              />
              <FeatureCard
                icon={Shield}
                title="Secure Authentication"
                description="Robust authentication with email, OAuth, and role-based access control."
                delay={0.6}
              />
            </div>
          </div>
        </ParallaxSection>

        {/* AI Features Section */}
        <ParallaxSection id="ai-features" className="relative w-full overflow-hidden py-24 md:py-32 lg:py-40">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/50 to-background" />
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_500px] lg:gap-16 xl:grid-cols-[1fr_550px]">
              <motion.div
                className="flex flex-col justify-center space-y-8"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="inline-block w-fit rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  AI-Powered
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-300">
                    <span className="block">Bridge the Gap Between</span>
                    <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent text-blue-200">
                      Technical and Non-Technical Teams
                    </span>
                  </h2>
                  <p className="max-w-[600px] text-xl text-muted-foreground">
                    Our AI features help everyone understand complex technical discussions, summarize long
                    conversations, and identify important messages.
                  </p>
                </div>
                <motion.ul
                  className="grid gap-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                >
                  {[
                    {
                      title: "Technical Translator",
                      description: "Simplifies technical jargon for non-technical team members",
                    },
                    {
                      title: "Code Explainer",
                      description: "Provides plain-language explanations of code snippets",
                    },
                    {
                      title: "Meeting Summarizer",
                      description: "Creates concise summaries of long conversations",
                    },
                    {
                      title: "Sentiment Analysis",
                      description: "Identifies urgent or important messages",
                    },
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <motion.div
                        className="rounded-full bg-primary/10 p-1.5"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span>
                        <strong>{item.title}</strong> - {item.description}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <AnimatedButton className="group" href="/signup">
                    <span>Try AI Features</span>
                    <motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </motion.span>
                  </AnimatedButton>
                </motion.div>
              </motion.div>
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  className="relative rounded-2xl border bg-card/80 p-6 shadow-2xl backdrop-blur-sm"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative space-y-4">
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-500">JD</span>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p>
                          We need to refactor the authentication middleware to use JWT tokens instead of session
                          cookies. This will help with scaling our microservices architecture.
                        </p>
                      </div>
                    </motion.div>
                    <motion.div
                      className="ml-10 rounded-lg border border-primary/20 bg-primary/5 p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-xs font-medium text-primary">AI Translation</p>
                      </div>
                      <p className="text-sm">
                        We need to change how users stay logged in, switching from browser cookies to a more modern
                        approach. This will make our system work better as we grow.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">TS</span>
                      </div>
                      <div className="rounded-lg bg-muted p-3 text-sm">
                        <p>Here's the code I'm thinking of implementing:</p>
                        <div className="mt-2 rounded bg-background p-2 font-mono text-xs">
                          <pre>{`const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)`}</pre>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="ml-10 rounded-lg border border-primary/20 bg-primary/5 p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Code className="h-4 w-4 text-primary" />
                        <p className="text-xs font-medium text-primary">AI Code Explanation</p>
                      </div>
                      <p className="text-sm">
                        This code creates a secure digital pass for users that expires after 7 days. It's like a
                        temporary ID card that proves who they are when using our app.
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </ParallaxSection>

        {/* Teams Section */}
        <ParallaxSection id="teams" className="w-full py-24 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Team Management
              </motion.div>
              <div className="space-y-2">
                <h2 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-4xl font-bold tracking-tighter text-blue-200 sm:text-5xl">
                  Organize Your Workspace
                </h2>
                <p className="mx-auto max-w-[900px] text-xl text-muted-foreground">
                  Create teams, manage members, and organize channels to streamline your collaboration workflow.
                </p>
              </div>
            </motion.div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-16 md:grid-cols-2">
              <motion.div
                className="group flex flex-col space-y-6 rounded-2xl border bg-card p-8 shadow-lg transition-all hover:border-primary/20 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl font-bold">Role-Based Access</h3>
                <p className="text-muted-foreground">
                  Assign different roles to team members with varying levels of permissions:
                </p>
                <motion.ul className="space-y-4" transition={{ staggerChildren: 0.1 }}>
                  {[
                    {
                      title: "Owners",
                      description: "Full control over team settings and members",
                    },
                    {
                      title: "Admins",
                      description: "Can manage channels and members",
                    },
                    {
                      title: "Members",
                      description: "Can participate in channels and conversations",
                    },
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    >
                      <motion.div
                        className="rounded-full bg-primary/10 p-1.5"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Shield className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span>
                        <strong>{item.title}</strong> - {item.description}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="mt-auto pt-4">
                  <AnimatedButton variant="outline" href="/signup">
                    Learn More
                  </AnimatedButton>
                </div>
              </motion.div>

              <motion.div
                className="group flex flex-col space-y-6 rounded-2xl border bg-card p-8 shadow-lg transition-all hover:border-primary/20 hover:shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -5 }}
              >
                <h3 className="text-2xl font-bold">Channel Organization</h3>
                <p className="text-muted-foreground">
                  Create different types of channels to organize your team's communication:
                </p>
                <motion.ul className="space-y-4" transition={{ staggerChildren: 0.1 }}>
                  {[
                    {
                      title: "Public Channels",
                      description: "Open to all team members",
                    },
                    {
                      title: "Private Channels",
                      description: "Invitation-only access",
                    },
                    {
                      title: "Role-Specific Channels",
                      description: "Tailored for technical or non-technical members",
                    },
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    >
                      <motion.div
                        className="rounded-full bg-primary/10 p-1.5"
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span>
                        <strong>{item.title}</strong> - {item.description}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="mt-auto pt-4">
                  <AnimatedButton variant="outline" href="/signup">
                    Learn More
                  </AnimatedButton>
                </div>
              </motion.div>
            </div>
          </div>
        </ParallaxSection>

        {/* CTA Section */}
        <section className="relative w-full overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 -z-10 bg-primary" />
          <motion.div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent opacity-70"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
            }}
          />

          <div className="container px-4 md:px-6">
            <motion.div
              className="flex flex-col items-center justify-center space-y-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-4 ">
                <h2 className="text-3xl font-bold tracking-tighter text-blue-200 sm:text-4xl md:text-5xl">
                  Ready to Transform Your Team Communication?
                </h2>
                <p className="mx-auto max-w-[700px] text-xl text-white">
                  Join thousands of teams already using our platform to collaborate more effectively.
                </p>
              </div>
              <motion.div
                className="flex flex-col gap-4 sm:flex-row"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <AnimatedButton size="lg" variant="secondary" className="group" href="/signup">
                  <span>Get Started for Free</span>
                  <motion.span initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.span>
                </AnimatedButton>
                <AnimatedButton
                  size="lg"
                  variant="outline"
                  className="border-blue-500 hover:black text-white"
                  href="/login"
                >
                  Login
                </AnimatedButton>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 md:py-16">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 md:px-6">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
              <MessageSquare className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.span
              className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-bold text-transparent"
              initial={{ letterSpacing: "0em" }}
              whileHover={{ letterSpacing: "0.05em" }}
              transition={{ duration: 0.3 }}
            >
              Syncora
            </motion.span>
          </motion.div>
          <motion.nav
            className="flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {["Features", "AI Features", "Teams", "Privacy", "Terms"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="group relative text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <motion.span initial={{ y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  {item}
                </motion.span>
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </motion.nav>
          <motion.p
            className="text-center text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            &copy; {new Date().getFullYear()} Syncora. All rights reserved.
          </motion.p>
        </div>
      </footer>
    </div>
  )
}

