"use client"
import type React from "react"
import Link from "next/link"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Users, ArrowRight, Sparkles, Zap, Mail } from "lucide-react"
import { useState, useEffect } from "react"



interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  updated_at: string
  last_message?: string
  profile?: {
    email: string
    avatar_url?: string
    full_name?: string
  }
}

interface DashboardOverviewProps {
  conversations: Conversation[]
}

export function DashboardOverview({ conversations }: DashboardOverviewProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    setIsLoaded(true)
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('.reveal').forEach(el => {
      observer.observe(el)
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`dashboard-container p-6 md:p-8 lg:p-10 transition-all duration-700 ease-out bg-zinc-950 text-zinc-100 ${isLoaded ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
      <div className="flex flex-col gap-8">
        <div className="hero-section flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent text-white">
              Dashboard
            </h1>
            <p className="mt-3 text-zinc-400 text-xl font-medium">
              Welcome back to your workspace
            </p>
          </div>
          
          <div className="pulse-container">
            <Button className="bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-2xl relative overflow-hidden group border border-zinc-800">
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Sparkles className="mr-2 h-5 w-5 text-indigo-400 animate-pulse" />
              <span className="font-bold">New Project</span>
            </Button>
          </div>
          
          <div className="absolute -z-10 top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-900/20 to-transparent rounded-full blur-3xl"></div>
        </div>

        <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`reveal reveal-delay-1 bg-zinc-900/50 h-full border border-zinc-800/50 relative backdrop-blur-lg transition-all duration-500 ease-out hover:translate-y-[-4px] rounded-3xl overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-lg font-bold text-zinc-100">Recent Messages</CardTitle>
              <div className="icon-container relative">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                <span className="absolute inset-0 bg-indigo-400/20 rounded-full blur-md opacity-50 animate-pulse-slow"></span>
              </div>
            </CardHeader>
            <CardContent className="z-10 relative">
              <div className="counter text-5xl font-black text-indigo-300">
                {conversations.length}
              </div>
              <p className="text-sm text-zinc-400 mt-1 font-medium">
                {conversations.length > 0 ? "Active conversations in your network" : "No recent conversations"}
              </p>
              <div className="mt-6">
                <Button asChild size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border-0 font-bold group">
                  <Link href="/dashboard/messages" className="flex items-center">
                    View Messages
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>

          <div className={`reveal bg-zinc-900/50 h-full border border-zinc-800/50 relative backdrop-blur-lg transition-all duration-500 ease-out hover:translate-y-[-4px] rounded-3xl overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-lg font-bold text-zinc-100">Find Users</CardTitle>
              <div className="icon-container relative">
                <Users className="h-5 w-5 text-purple-400" />
                <span className="absolute inset-0 bg-purple-400/20 rounded-full blur-md opacity-50 animate-pulse-slow"></span>
              </div>
            </CardHeader>
            <CardContent className="z-10 relative">
              <p className="text-sm text-zinc-400 mt-1 font-medium">Connect with team members and start collaborating instantly</p>
              <div className="mt-6">
                <Button asChild size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border-0 font-bold group mt-9">
                  <Link href="/dashboard/search" className="flex items-center">
                    Search Users
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>

          <div className={`reveal reveal-delay-2 bg-zinc-900/50 h-full border border-zinc-800/50 relative backdrop-blur-lg transition-all duration-500 ease-out hover:translate-y-[-4px] rounded-3xl overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
              <CardTitle className="text-lg font-bold text-zinc-100">Syncora Chat</CardTitle>
              <div className="icon-container relative">
                <Plus className="h-5 w-5 text-pink-400" />
                <span className="absolute inset-0 bg-pink-400/20 rounded-full blur-md opacity-50 animate-pulse-slow"></span>
              </div>
            </CardHeader>
            <CardContent className="z-10 relative">
              <p className="text-sm text-zinc-400 mt-1 font-medium">Launch a new thread with any team member in your network</p>
              <div className="mt-6">
                <Button asChild size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-2xl border-0 font-bold group mt-9">
                  <Link href="/sectors" className="flex items-center">
                   Seamless Talks, Stronger Connections
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </div>

        {conversations.length > 0 && (
          <div className="reveal conversations-section mt-6 relative">
            <div className="absolute -z-10 bottom-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-purple-900/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="bg-zinc-900/60 border border-zinc-800/50 backdrop-blur-lg relative overflow-hidden rounded-3xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/60 via-purple-500/60 to-pink-500/60"></div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-3xl font-black text-white">
                  Recent Conversations
                </CardTitle>
                <CardDescription className="text-zinc-400 text-lg">Your most recent message exchanges</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 conversation-list">
                  {conversations.map((conversation, index) => {
                    // Generate a gradient based on index
                    const gradients = [
                      'from-indigo-500/80 to-purple-500/80',
                      'from-purple-500/80 to-pink-500/80',
                      'from-pink-500/80 to-red-500/80'
                    ];
                    const gradient = gradients[index % gradients.length];
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`reveal conversation-card bg-zinc-900/40 relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:translate-x-2 border border-zinc-800/50 group`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Curved border on left */}
                        <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b ${gradient} rounded-l-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 rounded-2xl bg-zinc-800/50 relative">
                                <Zap className="h-6 w-6 text-indigo-400" />
                                <span className="absolute inset-0 bg-indigo-400/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-50 transition-opacity duration-300 animate-pulse-slow"></span>
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-2xl font-black text-white group-hover:text-indigo-300 transition-colors duration-300">
                                  {conversation.user1_id}
                                </h3>
                                
                                <div className="flex items-center mt-2 text-zinc-400">
                                  <Mail className="h-4 w-4 mr-2 text-indigo-400" />
                                  <p className="text-lg font-semibold text-indigo-300">
                                    {conversation.profile?.email || ""}
                                  </p>
                                </div>
                                
                                <p className="mt-3 text-base text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 line-clamp-1">
                                  {conversation.last_message || "No messages yet"}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <Button asChild size="lg" className="bg-zinc-800/70 hover:bg-zinc-700 text-white rounded-2xl border border-zinc-700/50 font-bold min-w-32">
                            <Link href={`/dashboard/messages/${conversation.id}`} className="flex items-center justify-center">
                              <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-300 absolute">
                                Open Chat
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center">
                                View <ArrowRight className="ml-2 h-5 w-5 transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300" />
                              </span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.7s cubic-bezier(0.5, 0, 0, 1);
        }
        
        .reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .reveal-delay-1 {
          transition-delay: 0.1s;
        }
        
        .reveal-delay-2 {
          transition-delay: 0.2s;
        }
        
        .conversation-list > div:nth-child(2) {
          transition-delay: 0.1s;
        }
        
        .conversation-list > div:nth-child(3) {
          transition-delay: 0.2s;
        }
        
        .conversation-list > div:nth-child(4) {
          transition-delay: 0.3s;
        }
        
        .conversation-list > div:nth-child(5) {
          transition-delay: 0.4s;
        }
      `}</style>
    </div>
  )
}