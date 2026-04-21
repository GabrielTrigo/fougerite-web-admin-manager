using System;
using System.IO;
using System.Net.Sockets;
using System.Text;

namespace FougeriteAdminBridge.Emulator
{
    /// <summary>
    /// Cliente Redis RESP mínimo via TCP puro.
    /// Compatível com o .NET 3.5.
    /// </summary>
    public class RawRedisClient : IDisposable
    {
        private TcpClient _tcp;
        private NetworkStream _stream;
        private StreamReader _reader;

        private readonly string _host;
        private readonly int _port;
        private readonly int _connectTimeoutMs;

        private static readonly Encoding Enc = Encoding.UTF8;

        public bool IsConnected
        {
            get { return _tcp != null && _tcp.Connected; }
        }

        public RawRedisClient(string host, int port, int connectTimeoutMs = 3000)
        {
            _host = host;
            _port = port;
            _connectTimeoutMs = connectTimeoutMs;
        }

        public void Connect()
        {
            AddressFamily family = _host.Contains(":") ? AddressFamily.InterNetworkV6 : AddressFamily.InterNetwork;
            _tcp = new TcpClient(family);

            IAsyncResult ar = _tcp.BeginConnect(_host, _port, null, null);
            bool ok = ar.AsyncWaitHandle.WaitOne(_connectTimeoutMs, false);
            if (!ok || !_tcp.Connected)
            {
                _tcp.Close();
                throw new IOException(string.Format("Redis connect timeout to {0}:{1}", _host, _port));
            }
            _tcp.EndConnect(ar);

            _tcp.SendTimeout = 2000;
            _tcp.ReceiveTimeout = 0;
            _tcp.NoDelay = true;

            _stream = _tcp.GetStream();
            _reader = new StreamReader(_stream, Enc);
        }

        public long LPush(string key, string value)
        {
            SendCommand("LPUSH", key, value);
            return ReadIntegerReply();
        }

        public long Publish(string channel, string message)
        {
            SendCommand("PUBLISH", channel, message);
            return ReadIntegerReply();
        }

        public void SubscribeAndBlock(string channel, Action<string, string> onMessage, Func<bool> keepRunning)
        {
            SendCommand("SUBSCRIBE", channel);
            ReadMultiBulkReply();

            while (keepRunning())
            {
                string[] parts = ReadMultiBulkReply();
                if (parts != null && parts.Length == 3 &&
                    string.Equals(parts[0], "message", StringComparison.OrdinalIgnoreCase))
                {
                    onMessage(parts[1], parts[2]);
                }
            }
        }

        private void SendCommand(params string[] args)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append('*');
            sb.Append(args.Length);
            sb.Append("\r\n");

            foreach (string a in args)
            {
                byte[] bytes = Enc.GetBytes(a);
                sb.Append('$');
                sb.Append(bytes.Length);
                sb.Append("\r\n");
                sb.Append(a);
                sb.Append("\r\n");
            }

            byte[] packet = Enc.GetBytes(sb.ToString());
            _stream.Write(packet, 0, packet.Length);
            _stream.Flush();
        }

        private long ReadIntegerReply()
        {
            string line = _reader.ReadLine();
            if (line == null) throw new IOException("Conexão fechada.");
            if (line.StartsWith("-")) throw new InvalidOperationException(line);
            return long.Parse(line.Substring(1));
        }

        private string[] ReadMultiBulkReply()
        {
            string header = _reader.ReadLine();
            if (header == null) throw new IOException("Conexão fechada.");
            if (header.StartsWith("-")) throw new InvalidOperationException(header);
            if (!header.StartsWith("*")) return null;

            int count = int.Parse(header.Substring(1));
            if (count <= 0) return new string[0];

            string[] parts = new string[count];
            for (int i = 0; i < count; i++)
            {
                string itemHeader = _reader.ReadLine();
                if (itemHeader == null) throw new IOException("Conexão fechada.");

                if (itemHeader.StartsWith(":"))
                {
                    parts[i] = itemHeader.Substring(1);
                }
                else if (itemHeader.StartsWith("$"))
                {
                    int len = int.Parse(itemHeader.Substring(1));
                    if (len < 0) { parts[i] = null; continue; }

                    char[] buf = new char[len];
                    int totalRead = 0;
                    while (totalRead < len)
                    {
                        int read = _reader.Read(buf, totalRead, len - totalRead);
                        if (read == 0) throw new IOException("Conexão fechada.");
                        totalRead += read;
                    }
                    _reader.ReadLine();
                    parts[i] = new string(buf);
                }
            }
            return parts;
        }

        public void Dispose()
        {
            try { if (_reader != null) _reader.Close(); } catch { }
            try { if (_stream != null) _stream.Close(); } catch { }
            try { if (_tcp != null) _tcp.Close(); } catch { }
        }
    }
}
