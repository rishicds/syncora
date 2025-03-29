"use client"

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useSupabase } from "@/components/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import type { GroupMember } from "@/types/group.types";
import type { Role } from "@/types/role.types";
import type { Profile } from "@/types/user.types";

interface ChannelMembersProps {
  members: (GroupMember & { profiles: Profile })[];
  roles: Role[];
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  refetchMembers: () => void;
}

export function ChannelMembers({
  members,
  roles,
  onClose,
  groupId,
  currentUserId,
  refetchMembers,
}: ChannelMembersProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openRolesPopover, setOpenRolesPopover] = useState(false);

  const getInitials = (profile: Profile) =>
    profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U";

  const membersByRole = members.reduce((acc, member) => {
    const highestRole = roles.filter((role) => member.role_ids.includes(role.id)).sort((a, b) => b.position - a.position)[0];
    if (!highestRole) return acc;
    if (!acc[highestRole.id]) acc[highestRole.id] = { role: highestRole, members: [] };
    acc[highestRole.id].members.push(member);
    return acc;
  }, {} as Record<string, { role: Role; members: (GroupMember & { profiles: Profile })[] }>);

  const sortedRoleGroups = Object.values(membersByRole).sort((a, b) => b.role.position - a.role.position);

  const handleAddMember = async () => {
    if (!email) {
      toast({ title: "Error", description: "Please enter an email", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.from("profiles").select("id").eq("email", email).single();
      if (userError || !userData) throw new Error("User not found");
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userData.id,
        role_ids: selectedRoles.length ? selectedRoles : [roles.find(r => r.name === "Everyone")?.id].filter(Boolean),
      });
      if (memberError) throw memberError;
      toast({ title: "Success", description: "Member added successfully" });
      setEmail("");
      setSelectedRoles([]);
      setOpen(false);
      refetchMembers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-64 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Members</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full"><Plus className="h-4 w-4 mr-2" />Add Member</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
            <Input type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-4" />
            <Popover open={openRolesPopover} onOpenChange={setOpenRolesPopover}>
              <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between">{selectedRoles.length ? `${selectedRoles.length} roles` : "Default: Everyone"}<ChevronsUpDown className="ml-2 h-4 w-4" /></Button></PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandGroup>{roles.map((role) => (
                    <CommandItem key={role.id} onSelect={() => setSelectedRoles(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id])}>
                      <Check className={selectedRoles.includes(role.id) ? "mr-2 h-4 w-4" : "mr-2 h-4 w-4 opacity-0"} />{role.name}
                    </CommandItem>))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={handleAddMember} disabled={isLoading} className="w-full mt-4">{isLoading ? "Adding..." : "Add Member"}</Button>
          </DialogContent>
        </Dialog>
        {sortedRoleGroups.map(({ role, members }) => (
          <div key={role.id} className="mt-4">
            <h4 className="text-sm font-medium mb-2" style={{ color: role.color }}>{role.name} — {members.length}</h4>
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6"><AvatarImage src={member.profiles.avatar_url} /><AvatarFallback>{getInitials(member.profiles)}</AvatarFallback></Avatar>
                <span className="text-sm truncate">{member.profiles.full_name || member.profiles.email}</span>
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
