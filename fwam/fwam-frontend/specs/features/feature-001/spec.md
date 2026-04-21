**Feature:** Persistência e Listagem Global de Jogadores (Histórico de Conexões)

**Objective:**
Permitir que administradores visualizem todos os jogadores que já se conectaram ao servidor, independentemente de estarem online ou offline, garantindo a persistência dos dados cadastrais e do último estado de conexão.

---

**Context:**
- **System:** FWAM (Fougerite Web Admin Manager)
- **Module:** Players / Telemetria (Componente inicial: .\fwam\fwam-frontend\src\app\pages\players\players.ts)
- **Problem:** Atualmente, a listagem de players é baseada exclusivamente em um cache volátil no Redis que é invalidado quando o jogador desconecta. Isso impede a visualização de jogadores offline e a gestão de usuários que não estão presentes no momento.
- **Expected impact:** Disponibilizar uma base de dados centralizada de jogadores para auditoria, consulta de SteamIDs e monitoramento de status em tempo real sem perda de dados após o logoff.

---

**Functional Requirements:**
- **RF01:** O sistema deve persistir informações do jogador (nome, SteamID, etc.) no banco de dados ao receber um evento de conexão.
- **RF02:** O sistema deve atualizar o estado de conexão (Online/Offline) no banco de dados sempre que um evento de "connected" ou "disconnected" for processado.
- **RF03:** A listagem de players no frontend deve carregar todos os registros armazenados, não apenas os presentes no cache de sessão.
- **RF04:** O sistema deve utilizar uma estratégia de cache para otimizar a leitura da lista de jogadores, evitando consultas excessivas ao banco de dados em operações de alta frequência.
- **RF05:** A interface deve refletir visualmente se o jogador está online ou offline através de tags de status.

---

**Business Rules:**
- **BR01:** O identificador único para persistência do jogador deve ser o SteamID.
- **BR02:** Caso um jogador já cadastrado conecte com um nome diferente, o registro existente deve ser atualizado com o nome mais recente.
- **BR03:** Um jogador deve ser marcado como "Offline" imediatamente após o processamento do evento de desconexão enviado pelo bridge.
- **BR04:** O cache no Redis deve atuar como um espelho da tabela de players do banco de dados para garantir performance na API de consulta.

---

**Flow:**
1. O plugin bridge no servidor Rust Legacy detecta uma alteração de estado (Player Connected/Disconnected).
2. O bridge envia o evento para o barramento de mensagens (Redis).
3. O worker do backend consome o evento.
4. O sistema verifica se o SteamID já existe na base de dados persistente:
    - **Se não existir:** Cria um novo registro com os dados do player e o status inicial.
    - **Se existir:** Atualiza os dados (nome) e altera o status de conexão.
5. Após a persistência, o sistema atualiza a entrada correspondente no cache para refletir o novo estado.
6. O frontend solicita a lista de jogadores via API.
7. O sistema retorna a lista completa (Online + Offline).
8. O frontend renderiza a tabela utilizando os componentes de UI (PrimeNG) e sinaliza o status de cada um.

---

**Acceptance Criteria:**
- **GIVEN** um jogador que nunca entrou no servidor
  **WHEN** ele se conectar pela primeira vez
  **THEN** um novo registro deve ser criado no banco de dados com seu SteamID e status "Online".

- **GIVEN** um jogador listado como "Online"
  **WHEN** ele se desconectar do servidor e o evento for processado
  **THEN** seu status na listagem deve mudar para "Offline" e ele deve permanecer visível na tabela.

- **GIVEN** que a página de players é carregada
  **WHEN** o backend responde à requisição
  **THEN** a lista deve conter a soma de todos os jogadores históricos cadastrados no banco de dados.

---

**Out of Scope:**
- Histórico detalhado de datas/horas de cada sessão individual (logs de login/logoff por data).
- Edição manual de dados de jogadores através da interface.
- Exclusão de registros de jogadores (Data Purge).

---

**Open Questions:**
- Como será tratada a paginação no frontend caso o banco de dados acumule milhares de jogadores únicos? R: Paginação via API
- Haverá um tempo de expiração para o status "Offline" no cache do Redis ou ele será mantido indefinidamente? R: Não, ele será mantido indefinidamente.
- O backend deve expor um endpoint específico para "Sincronização Forçada" caso o cache e o banco fiquem inconsistentes? R: Não, o cache será atualizado em tempo real.