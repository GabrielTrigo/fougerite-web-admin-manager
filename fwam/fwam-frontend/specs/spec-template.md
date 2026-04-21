# 📌 Feature: [Nome da Feature]

## 🎯 Objetivo
Descreva claramente o que essa feature resolve no negócio.

Ex:
Permitir a criação de pedidos com validação de estoque e cálculo automático de total.

---

## 🧠 Contexto
- Sistema:
- Módulo:
- Problema atual:
- Impacto esperado:

---

## ✅ Requisitos Funcionais

- [ ] RF01 - Deve permitir criar pedido com cliente
- [ ] RF02 - Deve permitir adicionar múltiplos itens
- [ ] RF03 - Deve validar estoque disponível
- [ ] RF04 - Deve calcular total automaticamente

---

## ⚠️ Regras de Negócio

- RN01 - Não permitir estoque negativo
- RN02 - Desconto máximo de 10%
- RN03 - Pedido deve ter pelo menos 1 item
- RN04 - Total = soma(itens) - desconto

---

## 🔌 Interfaces / API

### POST /orders
Request:
json
{
  "customerId": 1,
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}

Response:

{
  "id": 123,
  "total": 100.00
}

---

## 🔄 Fluxo

1. Receber requisição
2. Validar dados
3. Validar estoque
4. Calcular total
5. Persistir pedido
6. Retornar resposta

---

## 🧪 Critérios de Aceite (BDD)

* GIVEN estoque suficiente
  WHEN criar pedido
  THEN deve salvar com sucesso

* GIVEN estoque insuficiente
  WHEN criar pedido
  THEN deve retornar erro

---

## 🚧 Não Escopo

* Integração com pagamento
* Emissão de nota fiscal

---

## ❓ Dúvidas em aberto

* [ ] Pode criar pedido sem cliente?
* [ ] Permite desconto por item?
