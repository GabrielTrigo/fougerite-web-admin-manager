using System;
using System.Collections.Generic;
using System.Linq;

namespace FougeriteAdminBridge.Emulator
{
    public class EventSimulator
    {
        private readonly Random _rng = new Random();

        private List<string[]> _fakePlayersConnected = new List<string[]>();

        private readonly List<string[]> _fakePlayers = new List<string[]>
        {
            new[] { "76561198031234567", "Gabriel Trigo" },
            new[] { "76561197960287930", "Garry Newman" },
            new[] { "76561198000000001", "Survivor Juan" },
            new[] { "76561198000000002", "RustLover99" },
            new[] { "76561198123456789", "João Silva" },
            new[] { "76561198234567890", "Pedro Henrique" },
            new[] { "76561198345678901", "Lucas Mendes" },
            new[] { "76561198456789012", "Mateus Oliveira" },
            new[] { "76561198567890123", "Rafael Costa" },
            new[] { "76561198678901234", "Enzo Ferreira" },
            new[] { "76561198789012345", "Bruno Santos" },
            new[] { "76561198890123456", "Thiago Almeida" },
            new[] { "76561198901234567", "Vinicius Rocha" },
            new[] { "76561199012345678", "Felipe Martins" },
            new[] { "76561199123456789", "Diego Carvalho" },
            new[] { "76561199234567890", "Arthur Lima" },
            new[] { "76561199345678901", "Gustavo Pereira" },
            new[] { "76561199456789012", "Leonardo Souza" },
            new[] { "76561199567890123", "Matheus Ribeiro" },
            new[] { "76561199678901234", "Nicolas Barbosa" },
            new[] { "76561199789012345", "Samuel Teixeira" },
            new[] { "76561199890123456", "Caio Fernandes" },
            new[] { "76561199901234567", "André Cunha" },
            new[] { "76561198012345678", "Rodrigo Melo" },
            new[] { "76561198123456780", "Igor Moreira" },
            new[] { "76561198234567891", "Renato Cardoso" },
            new[] { "76561198345678902", "Vitor Hugo" },
            new[] { "76561198456789013", "Daniel Santos" },
            new[] { "76561198567890124", "Alexandre Pinto" },
            new[] { "76561198678901235", "Eduardo Ramos" },
            new[] { "76561198789012346", "Wesley Araújo" },
            new[] { "76561198890123457", "Kevin Nascimento" }
        };

        private readonly string[] _messages = {
            "Alguém tem comida?",
            "Vende metal?",
            "Base invadida na montanha!",
            "Friendly!",
            "Kkkkkkk que tiro!",
            "Onde fica a cidade grande?",
            "Recrutando para o clan [FOX]",
            "Alguém tem AK ou Thompson?",
            "Vende 1000 de pedra por scrap?",
            "Alguém quer fazer duo?",
            "Base pequena na floresta, quem quer raidar?",
            "Cuidado com o heli no mapa!",
            "Alguém dropou full gear aqui embaixo",
            "Preciso de sulfur, pago bem!",
            "Alguém viu o chinês voador?",
            "Kkkkkk morri pro trap de shotgun",
            "Base safe ou raid?",
            "Vende 500 de metal frag?",
            "Alguém tem C4 sobrando?",
            "Team de 3 procurando mais 2",
            "Friendly no spawn da praia!",
            "Que loot bom nessa base kkk",
            "Alguém quer fazer farm juntos?",
            "Cuidado com os hackers hoje",
            "Vou dropar um blue card pra quem ajudar",
            "Alguém tem kit médico?",
            "Raidando a base do rio agora!",
            "Preciso de wood, tenho scrap pra trocar",
            "Quem quer fazer oil rig comigo?",
            "Kkkkkk que noob morrendo pro bear",
            "Base grande na snow, quem topa?",
            "Alguém tem silenciador pra AK?",
            "Recrutando players ativos pro clã",
            "Dropei tudo no heli crash",
            "Alguém quer trocar 2k scrap por tech trash?",
            "Cuidado com os wolves na floresta!",
            "GG, boa raid galera",
            "Alguém na power plant?",
            "Vende 10 satchels?"
        };

        public GameEvent GenerateChat(string message = "")
        {
            if (_fakePlayersConnected.Count == 0) return null;

            var p = _fakePlayersConnected[_rng.Next(_fakePlayersConnected.Count)];

            return new GameEvent
            {
                Type = "Chat",
                UID = p[0],
                Name = p[1],
                Time = GetTimestamp(),
                Data = Mocks.GetChatJson(string.IsNullOrEmpty(message) ? _messages[_rng.Next(_messages.Length)] : message)
            };
        }

        public GameEvent GenerateMovement()
        {
            if (_fakePlayersConnected.Count == 0) return null;

            const int minX = 4000;
            const int maxX = 7500;
            const int minZ = -6150;
            const int maxZ = -1500;

            string[] p = _fakePlayersConnected[_rng.Next(_fakePlayersConnected.Count)];

            return new GameEvent
            {       
            Type = "PlayerMoved",
                UID = p[0],
                Name = p[1],
                Time = GetTimestamp(),
                Data = string.Format("{{\"x\": {0}, \"y\": {1}, \"z\": {2}}}",
                    _rng.Next(minX, maxX),
                    _rng.Next(350, 450),
                    _rng.Next(minZ, maxZ))
            };
        }

        public GameEvent GenerateJoin()
        {
            if (_fakePlayersConnected.Count == _fakePlayers.Count) return null;

            string[] p;

            do
            {
                p = _fakePlayers[_rng.Next(_fakePlayers.Count)];
            } while (_fakePlayersConnected.Contains(p));

            _fakePlayersConnected.Add(p);

            return new GameEvent
            {
                Type = "PlayerConnected",
                UID = p[0],
                Name = p[1],
                Time = GetTimestamp(),
                Data = string.Format("{{\"ip\": \"189.10.22.{0}\", \"ping\": {1}, \"location\": \"0,380,0\"}}", _rng.Next(255), _rng.Next(15, 120))
            };
        }

        public GameEvent GenerateDeath()
        {
            if (_fakePlayersConnected.Count == 0) return null;

            var victim = _fakePlayersConnected[_rng.Next(_fakePlayersConnected.Count)];
            var killer = _fakePlayersConnected[_rng.Next(_fakePlayersConnected.Count)];
            return new GameEvent
            {
                Type = "PlayerKilled",
                UID = victim[0],
                Name = victim[1],
                Time = GetTimestamp(),
                Data = Mocks.GetDeathJson(killer[1], "Bolt Action Rifle")
            };
        }

        public GameEvent GetItemResponse()
        {
            return new GameEvent
            {
                Type = "FWAM_Response_GameItemList",
                UID = "SERVER",
                Name = "System",
                Time = GetTimestamp(),
                Data = Mocks.GetItemResponseJson()
            };
        }

        private long GetTimestamp()
        {
            return (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
        }

        internal GameEvent GenerateSync()
        {
            List<string> jsonParts = new List<string>();
            foreach (var p in _fakePlayersConnected)
            {
                jsonParts.Add(string.Format("{{\"uid\":\"{0}\",\"name\":\"{1}\"}}", p[0], p[1]));
            }

            return new GameEvent
            {
                Type = "InitialPlayerSync",
                UID = "SERVER",
                Name = "System",
                Time = GetTimestamp(),
                Data = string.Format("{{\"players\":[{0}]}}", string.Join(",", jsonParts.ToArray()))
            };
        }

        internal GameEvent GenerateDisconnect(string id = "")
        {
            if (_fakePlayersConnected.Count == 0) return null;

            string[] p = null;

            if (!string.IsNullOrEmpty(id))
            {
                p = _fakePlayersConnected.FirstOrDefault(x => x[0] == id);
                if (p != null)
                {
                    _fakePlayersConnected.Remove(p);
                    return new GameEvent
                    {
                        Type = "PlayerDisconnected",
                        UID = p[0],
                        Name = p[1],
                        Time = GetTimestamp(),
                        Data = "{}"
                    };
                }
            }

            p = _fakePlayersConnected[_rng.Next(_fakePlayersConnected.Count)];

            _fakePlayersConnected.Remove(p);

            return new GameEvent
            {
                Type = "PlayerDisconnected",
                UID = p[0],
                Name = p[1],
                Time = GetTimestamp(),
                Data = "{}"
            };
        }

        internal string GenerateTelemetry() => Mocks.GetTelemetryJson();
    }
}
