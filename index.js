const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const fs = require('fs')
const cron = require('node-cron')

let db = fs.existsSync('./db.json')? JSON.parse(fs.readFileSync('./db.json')) : {}
const salvar = () => fs.writeFileSync('./db.json', JSON.stringify(db, null, 2))

function getPatente(d){
  if(d >= 30) return "Monge da Desova 🧘‍♂️"
  if(d == 29) return "Senhor do Sêmem 💧"
  if(d == 28) return "Ditador da Dureza 🎖️"
  if(d == 27) return "Cavaleiro da Espada Eterna 🤺"
  if(d == 26) return "O Inparavel, Incansavel, É ELE 🥵"
  if(d == 25) return "Vara de Ferro 🗡️"
  if(d == 24) return "Trucidador de Testículos 💀"
  if(d >= 21) return "Guerreiro Anti-Porra 🛡️"
  if(d >= 16) return "O Quebrador de Correntes ⛓️‍💥"
  if(d >= 14) return "Mão de Aço 💪"
  if(d >= 11) return "Punho Prateado 🥈"
  if(d >= 6) return "Marechal Punho Poderoso 🥇"
  if(d >= 3) return "Sargento Pau de Ferro 🪖"
  if(d == 2) return "Cabo Pau de Bronze 🥉"
  return "Soldado Porra 🪖"
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ auth: state, browser: ["NoFap Bot","Chrome","1.0"] })

  if(!sock.authState.creds.registered){
    const numero = "55" + await new Promise(r=>{
      const rl=require('readline').createInterface({input:process.stdin,output:process.stdout})
      rl.question('Digite seu numero com DDD ex: 11999999999: ', a=>{rl.close(); r(a)})
    })
    setTimeout(async()=>{
      const code = await sock.requestPairingCode(numero)
      console.log("\n\n=== SEU CODIGO DE PAREAMENTO: "+code+" ===\nVai no WhatsApp > Aparelhos conectados > Conectar com numero de telefone\n\n")
    }, 3000)
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m=messages[0]
    if(!m.message || m.key.fromMe) return
    const jid=m.key.remoteJid
    if(!jid.endsWith('@g.us')) return
    const sender=m.key.participant || jid
    const texto=(m.message.conversation||m.message.extendedTextMessage?.text||"").toLowerCase().trim()

    if(!db[jid]) db[jid]={}

    if(texto=="!entrar" || texto=="!participar"){
      db[jid][sender]={nome:m.pushName||"Guerreiro",dias:1,data:new Date().toDateString(),jid:sender}
      salvar()
      return sock.sendMessage(jid,{text:`⚔️ ${db[jid][sender].nome} entrou na guerra!\n\nDia 1\nPatente: ${getPatente(1)}\n\nDigite!check todo dia`})
    }
    if(texto=="!check"){
      const u=db[jid][sender]
      if(!u) return sock.sendMessage(jid,{text:"Você não tá na guerra! Digite!entrar"})
      if(u.data==new Date().toDateString()) return sock.sendMessage(jid,{text:`${u.nome} você já fez check hoje! Volte amanhã.\nPatente atual: ${getPatente(u.dias)}`})
      u.dias++; u.data=new Date().toDateString(); salvar()
      return sock.sendMessage(jid,{text:`✅ CHECK DIA ${u.dias}\n${u.nome} agora é:\n${getPatente(u.dias)}\n\nContinue firme!`})
    }
    if(texto=="!recaida" || texto=="!recaída"){
      const u=db[jid][sender]; if(!u) return
      u.dias=0; u.data=""; salvar()
      return sock.sendMessage(jid,{text:`💀 ${u.nome} teve recaída... voltou pro dia 0\nMas não desiste guerreiro! Digite!entrar pra voltar`})
    }
    if(texto=="!rank" || texto=="!ranking"){
      let lista=Object.values(db[jid]).sort((a,b)=>b.dias-a.dias).slice(0,15)
      let txt="🏆 RANKING NOFAP - SEPTEMBER EDITION 🏆\n\n"
      lista.forEach((u,i)=> txt+=`${i+1}º ${u.nome} - ${u.dias}d - ${getPatente(u.dias)}\n`)
      if(lista.length==0) txt+="Ninguém na guerra ainda. Digite!entrar"
      return sock.sendMessage(jid,{text:txt})
    }
    if(texto=="!patentes"){
      let txt="📜 PATENTES NOFAP\n\n1d - Soldado Porra 🪖\n2d - Cabo Pau de Bronze 🥉\n3-5d - Sargento Pau de Ferro 🪖\n6-10d - Marechal Punho Poderoso 🥇\n11-13d - Punho Prateado 🥈\n14-15d - Mão de Aço 💪\n16-20d - Quebrador de Correntes ⛓️‍💥\n21-23d - Guerreiro Anti-Porra 🛡️\n24d - Trucidador de Testículos 💀\n25d - Vara de Ferro 🗡️\n26d - O Inparavel, Incansavel 🥵\n27d - Cavaleiro da Espada Eterna 🤺\n28d - Ditador da Dureza 🎖️\n29d - Senhor do Sêmem 💧\n30d - Monge da Desova 🧘‍♂️"
      return sock.sendMessage(jid,{text:txt})
    }
  })

  cron.schedule('0 20 * * *', ()=>{
    for(let id in db) sock.sendMessage(id,{text:"⚔️ HORA DO CHECK-IN GUERREIROS!\nMandem!check ou!recaida\n!rank pra ver o ranking"})
  }, {timezone:"America/Sao_Paulo"})
  console.log("BOT RODANDO...")
}
start()
