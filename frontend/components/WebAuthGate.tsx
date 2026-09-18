import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "@/lib/supabase";

export function WebAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(Platform.OS !== "web");
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (Platform.OS !== "web") return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  if (Platform.OS !== "web") return <>{children}</>;
  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" /></View>;
  if (session?.user) return <>{children}</>;

  async function submit() {
    if (!email.trim() || !password) {
      setMessage("Enter your email and password.");
      return;
    }
    setBusy(true); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Account created. Check your email to confirm your account, then sign in.");
  }

  return (
    <View style={styles.page}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <View style={styles.card}>
        <View style={styles.mark}><Text style={styles.markText}>A</Text></View>
        <Text style={styles.logo}>ArtBoost AI</Text>
        <Text style={styles.heading}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
        <Text style={styles.copy}>Your art marketing workspace, stores, campaigns, publishing tools, and AI guidance in one place.</Text>
        <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#737373" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#737373" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={styles.primary} onPress={submit} disabled={busy}><Text style={styles.primaryText}>{busy ? "Working..." : mode === "login" ? "Sign in to ArtBoost" : "Create ArtBoost account"}</Text></Pressable>
        <Pressable onPress={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}><Text style={styles.switchText}>{mode === "login" ? "New to ArtBoost? Create an account" : "Already have an account? Sign in"}</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading:{flex:1,backgroundColor:"#09090b",alignItems:"center",justifyContent:"center"},
  page:{flex:1,minHeight:"100%",backgroundColor:"#09090b",alignItems:"center",justifyContent:"center",padding:28,overflow:"hidden"},
  glowOne:{position:"absolute",width:520,height:520,borderRadius:520,backgroundColor:"rgba(124,58,237,0.16)",top:-180,right:-120},
  glowTwo:{position:"absolute",width:420,height:420,borderRadius:420,backgroundColor:"rgba(37,99,235,0.10)",bottom:-180,left:-100},
  card:{width:"100%",maxWidth:470,backgroundColor:"rgba(20,20,23,0.96)",borderWidth:1,borderColor:"#2b2b31",borderRadius:24,padding:36},
  mark:{width:54,height:54,borderRadius:16,backgroundColor:"#7c3aed",alignItems:"center",justifyContent:"center",marginBottom:18},
  markText:{color:"#fff",fontSize:30,fontWeight:"900"},
  logo:{color:"#a78bfa",fontSize:15,fontWeight:"900",letterSpacing:1.1,marginBottom:28},
  heading:{color:"#fff",fontSize:30,fontWeight:"900",marginBottom:10},
  copy:{color:"#a3a3a3",fontSize:15,lineHeight:23,marginBottom:26},
  input:{height:52,borderRadius:13,borderWidth:1,borderColor:"#34343b",backgroundColor:"#111114",color:"#fff",paddingHorizontal:16,fontSize:15,marginBottom:12},
  message:{color:"#d4d4d8",fontSize:13,lineHeight:19,marginBottom:12},
  primary:{height:52,borderRadius:13,backgroundColor:"#7c3aed",alignItems:"center",justifyContent:"center",marginTop:4},
  primaryText:{color:"#fff",fontSize:15,fontWeight:"900"},
  switchText:{color:"#a78bfa",fontSize:13,fontWeight:"700",textAlign:"center",marginTop:20}
});