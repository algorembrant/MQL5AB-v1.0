//+------------------------------------------------------------------+
//|                                              DataProvider.mq5    |
//|                        MT5 Data Provider for Trading Terminal    |
//+------------------------------------------------------------------+
#property copyright "Trading Terminal"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

// Input parameters
input string ServerURL = "http://localhost:8080";  // Go backend URL
input int UpdateInterval = 1000;                    // Update interval in ms
input bool EnableStreaming = true;                  // Enable real-time streaming

// Global variables
datetime lastUpdate = 0;
CTrade trade;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("MT5 Data Provider EA initialized");
   Print("Server URL: ", ServerURL);
   
   EventSetTimer(1); // Set timer for 1 second
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("MT5 Data Provider EA stopped");
}

//+------------------------------------------------------------------+
//| Timer function - sends data periodically                         |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(!EnableStreaming) return;
   
   // Send current market data
   SendMarketData();
   
   // Send account info every 5 seconds
   static int counter = 0;
   counter++;
   if(counter >= 5)
   {
      SendAccountInfo();
      SendPositions();
      counter = 0;
   }
}

//+------------------------------------------------------------------+
//| Tick function - sends data on every tick                        |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!EnableStreaming) return;
   
   // Get current tick
   MqlTick tick;
   if(!SymbolInfoTick(_Symbol, tick))
   {
      Print("Failed to get tick data");
      return;
   }
   
   // Prepare JSON data
   string json = StringFormat(
      "{\"type\":\"tick\",\"symbol\":\"%s\",\"time\":%I64d,\"bid\":%.5f,\"ask\":%.5f,\"last\":%.5f,\"volume\":%I64d}",
      _Symbol,
      (long)tick.time * 1000, // Convert to milliseconds
      tick.bid,
      tick.ask,
      tick.last,
      tick.volume
   );
   
   // Send to backend (in production, use WebRequest)
   // Note: WebRequest requires the URL to be added to allowed URLs in Tools->Options->Expert Advisors
   // SendToBackend(json);
}

//+------------------------------------------------------------------+
//| Send current market data                                         |
//+------------------------------------------------------------------+
void SendMarketData()
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   
   int copied = CopyRates(_Symbol, _Period, 0, 100, rates);
   if(copied <= 0)
   {
      Print("Failed to copy rates");
      return;
   }
   
   // Build JSON array of candles
   string json = "{\"type\":\"candles\",\"symbol\":\"" + _Symbol + "\",\"timeframe\":\"" + 
                 EnumToString((ENUM_TIMEFRAMES)_Period) + "\",\"data\":[";
   
   for(int i = 0; i < MathMin(copied, 100); i++)
   {
      if(i > 0) json += ",";
      json += StringFormat(
         "{\"time\":%I64d,\"open\":%.5f,\"high\":%.5f,\"low\":%.5f,\"close\":%.5f,\"volume\":%I64d}",
         (long)rates[i].time * 1000,
         rates[i].open,
         rates[i].high,
         rates[i].low,
         rates[i].close,
         rates[i].tick_volume
      );
   }
   
   json += "]}";
   
   // SendToBackend(json);
}

//+------------------------------------------------------------------+
//| Send account information                                         |
//+------------------------------------------------------------------+
void SendAccountInfo()
{
   string json = StringFormat(
      "{\"type\":\"account\",\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"free_margin\":%.2f,\"profit\":%.2f,\"leverage\":%d}",
      AccountInfoDouble(ACCOUNT_BALANCE),
      AccountInfoDouble(ACCOUNT_EQUITY),
      AccountInfoDouble(ACCOUNT_MARGIN),
      AccountInfoDouble(ACCOUNT_MARGIN_FREE),
      AccountInfoDouble(ACCOUNT_PROFIT),
      (int)AccountInfoInteger(ACCOUNT_LEVERAGE)
   );
   
   // SendToBackend(json);
}

//+------------------------------------------------------------------+
//| Send open positions                                              |
//+------------------------------------------------------------------+
void SendPositions()
{
   string json = "{\"type\":\"positions\",\"data\":[";
   
   int total = PositionsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(i > 0) json += ",";
         
         string symbol = PositionGetString(POSITION_SYMBOL);
         ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double price_open = PositionGetDouble(POSITION_PRICE_OPEN);
         double price_current = PositionGetDouble(POSITION_PRICE_CURRENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         
         json += StringFormat(
            "{\"ticket\":%I64d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price_open\":%.5f,\"price_current\":%.5f,\"profit\":%.2f,\"sl\":%.5f,\"tp\":%.5f}",
            ticket,
            symbol,
            type == POSITION_TYPE_BUY ? "BUY" : "SELL",
            volume,
            price_open,
            price_current,
            profit,
            sl,
            tp
         );
      }
   }
   
   json += "]}";
   
   // SendToBackend(json);
}

//+------------------------------------------------------------------+
//| Send data to backend (using WebRequest)                         |
//+------------------------------------------------------------------+
void SendToBackend(string json_data)
{
   // Prepare the request
   char post_data[];
   char result_data[];
   string result_headers;
   
   StringToCharArray(json_data, post_data, 0, StringLen(json_data));
   
   // Send HTTP POST request
   // Note: Add your backend URL to Tools->Options->Expert Advisors->Allow WebRequest for listed URL
   int res = WebRequest(
      "POST",
      ServerURL + "/data",
      "Content-Type: application/json\r\n",
      5000, // timeout
      post_data,
      result_data,
      result_headers
   );
   
   if(res == -1)
   {
      Print("WebRequest error: ", GetLastError());
      Print("Make sure to add ", ServerURL, " to allowed URLs in Tools->Options->Expert Advisors");
   }
}

//+------------------------------------------------------------------+
//| Get symbol information                                           |
//+------------------------------------------------------------------+
string GetSymbolInfo(string symbol)
{
   return StringFormat(
      "{\"symbol\":\"%s\",\"bid\":%.5f,\"ask\":%.5f,\"spread\":%d,\"digits\":%d,\"point\":%.5f}",
      symbol,
      SymbolInfoDouble(symbol, SYMBOL_BID),
      SymbolInfoDouble(symbol, SYMBOL_ASK),
      (int)SymbolInfoInteger(symbol, SYMBOL_SPREAD),
      (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS),
      SymbolInfoDouble(symbol, SYMBOL_POINT)
   );
}

//+------------------------------------------------------------------+
//| Execute backtest strategy                                        |
//+------------------------------------------------------------------+
void ExecuteBacktest(string strategy_code)
{
   Print("Executing backtest with provided strategy");
   
   // In a real implementation, you would:
   // 1. Parse the strategy code
   // 2. Run it on historical data
   // 3. Collect statistics
   // 4. Send results back to backend
   
   // For now, just log it
   Print("Strategy code received: ", strategy_code);
}
//+------------------------------------------------------------------+