# 📌 Plano Técnico: Refatoração Global do Rust Design System

## 🎯 Objetivo
Padronizar globalmente os comportamentos visuais de busca, tabelas e selects no frontend do FWAM, consolidando a maior parte do styling no `RustPreset` e nas variáveis globais de `src\styles.css`, sem quebrar o layout responsivo atual das páginas administrativas.

---

## 🧠 Contexto
- **Sistema:** Fougerite Web Admin Manager (FWAM)
- **Módulo:** Frontend (`fwam-frontend`)
- **Estado atual:**
  - O projeto já possui um preset global PrimeNG em `src\app\core\services\rust-preset.ts`, aplicado via `providePrimeNG({ unstyled: true, pt: RustPreset })`.
  - Os tokens globais ativos estão em `src\styles.css` com a convenção `--color-rust-*`; a spec cita `--rust-*`, mas o código atual usa a nomenclatura `--color-rust-*` como fonte de verdade.
  - Há divergência de implementação entre telas: `players.ts` usa `p-iconfield`/`p-inputicon`, enquanto `bans.ts` ainda usa ícone absoluto manual com `pl-9`.
  - As tabelas já recebem parte do acabamento pelo preset `datatable`, mas ainda dependem de wrappers locais (`rust-panel`, `overflow-x-auto`, `min-w-*`) para ergonomia e responsividade.
  - O `p-select` da tela de Players usa `appendTo="body"` e `filter`, porém o preset atual ainda não define contrato completo para altura máxima, rolagem e consistência visual do overlay.
- **Problema atual:** O design system está parcialmente centralizado, mas ainda há sobreposição de responsabilidades entre preset global e classes locais, o que gera inconsistência visual e risco de regressão entre telas.
- **Impacto esperado:** Um contrato visual único para campos de busca, `p-table` e `p-select`, com menor acoplamento por tela e melhor previsibilidade para novas páginas.

---

## ✅ Requisitos Funcionais

- [ ] **RF01 - Contrato global para busca:** Definir um padrão global para campos com ícone de pesquisa, cobrindo `p-iconfield`/`p-inputicon` e eliminando composições locais frágeis onde fizer sentido.
- [ ] **RF02 - Espaçamento consistente em tabelas:** Ajustar o `datatable` pass-through e, se necessário, utilitários globais para dar respiro horizontal/vertical sem comprometer colunas de ação ou tabelas com `responsiveLayout="scroll"`.
- [ ] **RF03 - Overlay opaco e rolável em selects:** Expandir o preset de `select` para garantir fundo sólido, altura máxima controlada, rolagem vertical e boa convivência com `appendTo="body"` e filtro.
- [ ] **RF04 - Compatibilização por tela:** Revisar as páginas já afetadas (`players`, `bans`, `security`, `automation`) e remover ou reduzir overrides locais que entrem em conflito com o novo contrato global.
- [ ] **RF05 - Validação de regressão visual mínima:** Confirmar que o build continua íntegro e que os fluxos principais (Players, Logs/Segurança, Bans, Give Item) permanecem utilizáveis após a centralização.

---

## ⚠️ Regras de Negócio

- **RN01 - Fonte única de tokens:** Priorizar os tokens já existentes em `src\styles.css` (`--color-rust-*`) em vez de introduzir uma segunda família de variáveis.
- **RN02 - Centralização via PrimeNG PT:** Alterações globais de PrimeNG devem nascer primeiro no `RustPreset`; CSS global complementar só deve cobrir o que o pass-through não resolver bem.
- **RN03 - Segurança de layout:** O ganho de espaçamento em tabela deve privilegiar wrapper, células e slots do preset sem aumentar artificialmente larguras mínimas já usadas pelas páginas.
- **RN04 - Compatibilidade com overlays:** Dropdowns e overlays precisam continuar funcionando dentro de dialogs/drawers e com `appendTo="body"`, mantendo legibilidade e hierarquia visual.
- **RN05 - Refactor progressivo:** Onde houver composição local necessária por limitação do componente, documentar isso no plano de implementação e reduzir duplicação ao mínimo.

---

## 🔌 Interfaces / API

### Arquivos centrais
| Arquivo | Papel técnico no refactor |
| :--- | :--- |
| `src\app\core\services\rust-preset.ts` | Fonte principal do contrato global para `datatable`, `inputtext`, `select` e possivelmente `iconfield` / `inputicon`, conforme suporte do preset atual |
| `src\styles.css` | Tokens globais, utilitários complementares e eventuais classes de apoio para padding/overlay quando PT não bastar |
| `src\app\pages\players\players.ts` | Tela de referência com `p-iconfield`, `p-table` e `p-select [filter]="true"` |
| `src\app\pages\bans\bans.ts` | Caso atual com busca implementada manualmente e tabela paginada |
| `src\app\pages\security\security.ts` | Tabelas compactas com inputs inline, úteis para validar densidade visual |
| `src\app\pages\automation\automation.ts` | Tabela adicional para validar consistência do preset fora dos fluxos de moderação |

### Contratos técnicos a consolidar
| Área | Situação atual | Direção do plano |
| :--- | :--- | :--- |
| **Busca** | Implementação mista entre `p-iconfield` e ícone absoluto manual | Unificar markup e/ou contrato visual para que o ícone nunca concorra com texto/cursor |
| **Tabela** | Preset já define `headerCell`, `bodyCell`, `paginator`, mas wrappers variam por página | Ajustar preset e utilitários para respiro consistente preservando `overflow-x-auto` e `min-w-*` locais quando necessários |
| **Select** | Overlay já tem cor e borda, mas sem regra clara de altura/scroll | Definir slots/classes para painel, lista e área rolável com viewport safety |

---

## 🔄 Fluxo

1. Mapear todos os pontos de uso de busca, tabela e select nas páginas administrativas para identificar conflitos entre preset global e classes locais.
2. Definir o contrato global alvo no `RustPreset`, usando os tokens `--color-rust-*` já existentes e evitando duplicação semântica em `styles.css`.
3. Ajustar o styling global de tabela e select, com foco em padding consistente, overlay opaco, área rolável e comportamento seguro em viewport menor.
4. Refatorar as páginas impactadas para aderirem ao contrato global, removendo composições locais redundantes e mantendo apenas overrides estritamente necessários.
5. Validar build e revisar visualmente os fluxos críticos onde a spec aponta regressão: Players, Bans, Inventário/Give Item e telas com tabelas compactas.

---

## 🗂️ Plano de Execução / Tasks

### Fase 1 — Auditoria e decisão técnica
- [ ] **T1 — Inventariar usos de busca:** Mapear todas as telas que usam busca com `p-iconfield`, `p-inputicon` ou ícone absoluto manual, registrando diferenças de markup e classes.
- [ ] **T2 — Inventariar usos de tabela:** Mapear tabelas com `p-table`, wrappers (`rust-panel`, `overflow-x-auto`, `min-w-*`) e pontos em que o spacing ainda depende da página.
- [ ] **T3 — Inventariar usos de select/overlay:** Levantar os usos de `p-select`, `appendTo="body"` e `filter`, com foco no fluxo Give Item e em possíveis overlays semelhantes.
- [ ] **T4 — Validar superfície de customização do PrimeNG PT:** Confirmar quais slots do preset atual conseguem cobrir `inputtext`, `datatable`, `select`, e se há suporte suficiente para tratar `iconfield` / `inputicon` sem workaround excessivo.

### Fase 2 — Contrato global do design system
- [ ] **T5 — Definir estratégia de tokens e utilitários:** Consolidar no plano que a fonte de verdade continua sendo `--color-rust-*` em `src\styles.css`, e listar apenas os utilitários globais realmente necessários.
- [ ] **T6 — Definir padrão global de busca:** Escolher o contrato final para campos com ícone de busca, incluindo alinhamento do ícone, padding do input e fallback caso PT não resolva `iconfield`.
- [ ] **T7 — Definir padrão global de tabela:** Especificar o contrato de spacing para `datatable` e o limite entre responsabilidade do preset e responsabilidade dos wrappers locais.
- [ ] **T8 — Definir padrão global de select:** Especificar o contrato de overlay para `p-select`, incluindo opacidade, altura máxima, rolagem, comportamento com filtro e segurança em viewport menor.

### Fase 3 — Refactor do núcleo global
- [ ] **T9 — Refatorar `rust-preset.ts` para busca:** Aplicar o contrato global decidido para input e ícones de busca, minimizando dependências de classes locais.
- [ ] **T10 — Refatorar `rust-preset.ts` para tabelas:** Ajustar slots de `datatable` para padding, wrapper visual e consistência entre header, body, empty state e paginator.
- [ ] **T11 — Refatorar `rust-preset.ts` para selects:** Ajustar slots de `select` para overlay opaco, área rolável e altura limitada pela viewport.
- [ ] **T12 — Complementar `src\styles.css` apenas onde necessário:** Adicionar utilitários ou tokens auxiliares somente para gaps que o PT não cubra adequadamente.

### Fase 4 — Adequação das páginas
- [ ] **T13 — Adequar `players.ts`:** Remover overrides locais desnecessários e alinhar busca, tabela e `p-select` do modal Give Item ao novo contrato global.
- [ ] **T14 — Adequar `bans.ts`:** Migrar a busca com ícone absoluto manual para o padrão global e revisar dependências locais da tabela.
- [ ] **T15 — Adequar `security.ts`:** Validar que tabelas compactas e inputs inline continuam legíveis com o novo spacing global.
- [ ] **T16 — Adequar `automation.ts`:** Alinhar a tabela de automações ao novo contrato e confirmar consistência com telas de densidade média.

### Fase 5 — Validação e fechamento
- [ ] **T17 — Executar build do frontend:** Rodar o build existente do `fwam-frontend` para detectar regressões de template, typing ou preset.
- [ ] **T18 — Revisar critérios de aceite da spec:** Conferir os fluxos críticos da spec contra o resultado implementado, principalmente Players, Bans, Inventário/Give Item e tabelas com scroll.

### Ordem recomendada de execução
1. T1 → T4
2. T5 → T8
3. T9 → T12
4. T13 → T16
5. T17 → T18

---

## 🧪 Critérios de Aceite (BDD)

* **GIVEN** uma tela com campo de pesquisa baseado em PrimeNG
  **WHEN** o usuário focar e digitar no input
  **THEN** o ícone de busca não deve sobrepor cursor, placeholder ou texto digitado.

* **GIVEN** uma tabela paginada do módulo administrativo
  **WHEN** a tela for renderizada em layout desktop ou com rolagem horizontal
  **THEN** o conteúdo deve manter respiro visual consistente sem cortar colunas de ação.

* **GIVEN** o diálogo "Give Item" na tela de Players
  **WHEN** o `p-select` for aberto com muitos itens
  **THEN** o painel deve ter fundo opaco, altura limitada pela viewport e rolagem utilizável.

* **GIVEN** a aplicação usando o preset global do PrimeNG
  **WHEN** uma página precisar de busca, tabela ou select
  **THEN** o comportamento visual base deve vir do design system centralizado e não de ajustes ad hoc por tela.

---

## 🚧 Não Escopo

* Troca da biblioteca PrimeNG ou mudança do modo `unstyled`
* Alterações na lógica de dados, polling, backend ou Redis
* Reestruturação ampla das páginas além do necessário para aderir ao contrato visual global
* Criação de novos filtros ou features de busca além da correção de UX e padronização visual

---

## ❓ Dúvidas em aberto

* [ ] Se o suporte de PT para `iconfield` / `inputicon` no conjunto atual do projeto for insuficiente, decidir durante a implementação se o padrão final será um wrapper CSS reutilizável ou a migração total para um único markup de busca.
* [ ] Confirmar durante a implementação se alguma tabela compacta precisa manter densidade reduzida como exceção explícita do design system.
