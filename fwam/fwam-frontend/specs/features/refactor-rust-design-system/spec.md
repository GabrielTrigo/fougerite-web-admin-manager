Com base nas suas definições, atualizei a especificação para refletir que as melhorias de UI/UX agora possuem **escopo global**, impactando o `RustPreset` e o sistema de estilos base do projeto.

---

# 📌 Feature: Padronização Global de UI/UX (Design System Rust)

## 🎯 Objetivo
Corrigir inconsistências visuais críticas e melhorar a usabilidade em toda a interface do FWAM, garantindo que componentes de busca, tabelas e menus suspensos sigam rigorosamente a estética "Rust Legacy" e funcionem corretamente em todos os módulos.

## 🧠 Contexto
- **Sistema:** Fougerite Web Admin Manager (FWAM)
- **Módulo:** Frontend (`fwam-frontend`)
- **Problema:** Ícones de busca sobrepostos, falta de respiro em tabelas e dropdowns transparentes/quebrados.
- **Impacto esperado:** Interface coesa, profissional e sem erros de oclusão visual, facilitando a navegação do administrador em qualquer tela do sistema.

---

## ✅ Requisitos Funcionais

- **RF01 - Alinhamento Global de Ícones de Busca:** Corrigir o posicionamento do ícone de pesquisa em todos os campos de entrada do sistema, garantindo que não haja sobreposição com o texto.
- **RF02 - Espaçamento Padronizado em Tabelas:** Aplicar margens e preenchimentos (padding) consistentes em todos os componentes de tabela (`p-table`) do projeto.
- **RF03 - Dropdowns Opacos e Funcionais:** Garantir que todos os menus de seleção (dropdowns) possuam fundo sólido e suporte a rolagem.
- **RF04 - Ajuste Dinâmico de Altura:** Implementar redimensionamento dinâmico para overlays e dropdowns para se adaptarem ao conteúdo e à viewport.

---

## ⚠️ Regras de Negócio

- **RN01 - Centralização via RustPreset:** Todas as alterações de estilo de componentes devem ser feitas preferencialmente no arquivo `rust-preset.ts` para garantir que o PrimeNG (unstyled) aplique as mudanças globalmente.
- **RN02 - Uso de Variáveis Globais:** Utilizar estritamente as variáveis CSS definidas em `src\styles.css` (ex: `--rust-bg-dark`, `--rust-accent`) para manter a paleta de cores do Rust Legacy.
- **RN03 - Não Quebra de Layout:** O ajuste de padding nas tabelas não deve esconder colunas de ação ou comprometer a visualização em telas de baixa resolução.

---

## 🔌 Interfaces / API

### Arquivos Chave para Modificação
* `fwam\fwam-frontend\src\app\core\services\rust-preset.ts`: Para regras globais de `Table`, `InputText` e `Dropdown`.
* `fwam\fwam-frontend\src\styles.css`: Para tokens de utilidade de alinhamento e cores de fundo.

### Estrutura de Estilo (Exemplo Técnico)
| Componente | Propriedade PT (Pass-Through) | Ajuste Necessário |
| :--- | :--- | :--- |
| **Table** | `root` / `wrapper` | Adicionar padding horizontal e vertical |
| **InputText** | `icon` / `root` | Ajustar `left-padding` ou `position` do ícone |
| **Dropdown** | `panel` / `listWrapper` | Definir `background-color` e `max-height` com `overflow-y: auto` |

---

## 🔄 Fluxo

1. **Atualização do Preset:** O desenvolvedor modifica o objeto `RustPreset` para incluir as classes de estilo corretas nos componentes afetados.
2. **Correção Global:** As mudanças são propagadas para a página de Players, Dashboard e Logs simultaneamente.
3. **Validação de Renderização:** O sistema renderiza os dropdowns com fundo opaco e as tabelas com o distanciamento correto das bordas da página.

---

## 🧪 Critérios de Aceite (BDD)

* **GIVEN** que o administrador navega entre diferentes telas (Players, Inventário, Logs)
    **WHEN** observar qualquer tabela de dados
    **THEN** o conteúdo não deve encostar nas bordas laterais do container principal.

* **GIVEN** a necessidade de buscar um item ou jogador
    **WHEN** o usuário interage com o campo de pesquisa
    **THEN** o ícone de busca deve estar posicionado à esquerda ou direita sem obstruir o cursor ou o texto digitado.

* **GIVEN** uma lista extensa de itens no menu "Give Item"
    **WHEN** o dropdown for aberto
    **THEN** o fundo deve ser opaco (`--rust-bg-dark`) e o usuário deve conseguir rolar a lista sem que o menu ultrapasse o limite inferior da tela.

---

## 🚧 Não Escopo

* Mudança de bibliotecas de UI (permanecer com PrimeNG).
* Alterações na lógica de comunicação com o Redis ou Backend.
* Implementação de novos filtros de busca além dos já existentes.