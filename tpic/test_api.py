"""
Script de teste rápido para validar Claude API Key
"""

from dotenv import load_dotenv
import os
import anthropic

print("=" * 70)
print("🔧 TESTE DE CONFIGURAÇÃO - Claude API")
print("=" * 70)
print()

# 1. Carregar variáveis de ambiente
print("1️⃣  Carregando arquivo .env...")
load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")

# 2. Verificar se a chave foi carregada
print()
if api_key:
    print("✅ Chave carregada com sucesso!")
    print(f"   Primeiros 15 caracteres: {api_key[:15]}...")
    print(f"   Últimos 5 caracteres: ...{api_key[-5:]}")
    print(f"   Comprimento total: {len(api_key)} caracteres")
else:
    print("❌ Chave NÃO encontrada!")
    print("   Verifique se .env foi criado corretamente")
    exit(1)

# 3. Testar conexão com API
print()
print("2️⃣  Testando conexão com Claude API...")
print()

try:
    client = anthropic.Anthropic(api_key=api_key)
    
    print("   Enviando mensagem de teste...")
    message = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=100,
        messages=[
            {"role": "user", "content": "Diga apenas a palavra 'Funcionando!' nada mais"}
        ]
    )
    
    response_text = message.content[0].text
    print()
    print("✅ API Claude está FUNCIONANDO PERFEITAMENTE!")
    print(f"   Resposta: {response_text}")
    print()
    print("=" * 70)
    print("✓ TUDO OK! Você pode rodar os testes agora:")
    print()
    print("   bash run_tpic.sh")
    print()
    print("=" * 70)
    
except Exception as e:
    print()
    print(f"❌ ERRO ao conectar com API: {e}")
    print()
    print("=" * 70)
    print("💡 POSSÍVEIS SOLUÇÕES:")
    print()
    
    error_str = str(e).lower()
    
    if "401" in error_str or "unauthorized" in error_str:
        print("  1. ❌ Chave inválida ou expirada")
        print("     → Gerar nova chave em: https://console.anthropic.com/api/keys")
        print("     → Atualizar .env com a nova chave")
    
    elif "429" in error_str or "rate limit" in error_str:
        print("  1. ⏱️ Rate limit atingido")
        print("     → Aguarde alguns minutos")
        print("     → Tente novamente")
    
    elif "connection" in error_str or "network" in error_str:
        print("  1. 🌐 Problema de conexão de rede")
        print("     → Verifique sua conexão internet")
        print("     → Tente novamente")
    
    elif "model" in error_str:
        print("  1. 🤖 Modelo não disponível")
        print("     → Verifique o nome do modelo em claude_vision.py")
        print("     → Modelos disponíveis: claude-3-5-haiku-20241022, claude-3-5-sonnet-20241022")
    
    print()
    print("=" * 70)
    exit(1)
