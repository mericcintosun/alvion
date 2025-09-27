// smart_contracts/policy_guard/contract.algo.ts
import {
    arc4,
    assert,
    Bytes,
    GlobalState,
    gtxn,
    op,
    Txn,
    uint64,
    Uint64,
    TransactionType,
    Account,
    Application,
  } from "@algorandfoundation/algorand-typescript";
  
  /**
   * Alvion Policy Guard (ATS)
   * - Grup boyutu, toplam fee limiti
   * - Aynı sender, rekey/close-to yasak
   * - Allowed App ID listesi (Application tipi)
   * - Ödeme/ASA transfer üst sınırı
   * - Tinyman Router çağrısında minOut > 0 kontrolü (btoi)
   */
  export default class PolicyGuard extends arc4.Contract {
    // --- Global State ---
    creator = GlobalState<Account>({ key: Bytes("creator") });
  
    maxFeeMicroAlgo = GlobalState<uint64>({ key: Bytes("max_fee"),    initialValue: Uint64(200_000) });
    maxAmountMicroAlgo = GlobalState<uint64>({ key: Bytes("max_amt"),  initialValue: Uint64(1_000_000_000) });
    maxSlippageBps    = GlobalState<uint64>({ key: Bytes("max_slip"),  initialValue: Uint64(50) }); // %0.50
  
    // Allowed protocol app'leri Application tipinde tut
    folksDepositApp  = GlobalState<Application>({ key: Bytes("folks_dep"),  initialValue: Application() });
    folksStakingApp  = GlobalState<Application>({ key: Bytes("folks_stk"),  initialValue: Application() });
    tinymanRouterApp = GlobalState<Application>({ key: Bytes("t_router"),   initialValue: Application() });
    tinymanPoolApp   = GlobalState<Application>({ key: Bytes("t_pool"),     initialValue: Application() });
  
    // --- Lifecycle / Admin ---
  
    // Optional param YOK; onCreate için net ABI imzası
    @arc4.abimethod({ onCreate: "allow" }) // "allow" | "disallow" | "require"
    public init(maxFee: uint64, maxAmount: uint64, maxSlipBps: uint64): void {
      this.creator.value = Txn.sender;
      this.maxFeeMicroAlgo.value   = maxFee;
      this.maxAmountMicroAlgo.value= maxAmount;
      this.maxSlippageBps.value    = maxSlipBps;
    }
  
    // Allowed app'leri tek çağrıda set et
    @arc4.abimethod()
    public setAllowedApps(
      folksDeposit: Application,
      folksStaking: Application,
      tinymanRouter: Application,
      tinymanPool: Application,
    ): void {
      assert(Txn.sender === this.creator.value, "Only creator");
      this.folksDepositApp.value  = folksDeposit;
      this.folksStakingApp.value  = folksStaking;
      this.tinymanRouterApp.value = tinymanRouter;
      this.tinymanPoolApp.value   = tinymanPool;
    }
  
    @arc4.abimethod()
    public updatePolicy(maxFee: uint64, maxAmount: uint64, maxSlipBps: uint64): void {
      assert(Txn.sender === this.creator.value, "Only creator");
      this.maxFeeMicroAlgo.value    = maxFee;
      this.maxAmountMicroAlgo.value = maxAmount;
      this.maxSlippageBps.value     = maxSlipBps;
    }
  
    // --- Guard ---
  
    @arc4.abimethod({ readonly: true })
    public enforce(): void {
      const n = op.Global.groupSize;
  
      assert(n >= Uint64(2),  "group too small");
      assert(n <= Uint64(16), "group too large");
  
      // Toplam fee
      let totalFee = Uint64(0);
      let i = Uint64(0);
      while (i < n) {
        const t = gtxn.Transaction(i);
        totalFee = totalFee + t.fee;
        i = i + Uint64(1);
      }
      assert(totalFee <= this.maxFeeMicroAlgo.value, "total fee too high");
  
      // En az bir allowed app call
      let hasAllowed = false;
      i = Uint64(0);
      while (i < n) {
        const t = gtxn.Transaction(i);
        if (t.type === TransactionType.ApplicationCall) {
          const appCall = gtxn.ApplicationCallTxn(i);
          const appId = appCall.appId;
          if (
            appId === this.folksDepositApp.value  ||
            appId === this.folksStakingApp.value  ||
            appId === this.tinymanRouterApp.value ||
            appId === this.tinymanPoolApp.value
          ) {
            hasAllowed = true;
  
            // Tinyman Router ise minOut sanity: arg[1] > 0
            if (appId === this.tinymanRouterApp.value) {
              assert(appCall.numAppArgs >= Uint64(2), "router args");
              const minOut = op.btoi(appCall.appArgs(Uint64(1))); // bytes -> uint64
              assert(minOut > Uint64(0), "minOut=0");
              // Not: gerçek slippage formülü için quotedOut girişi gerekir; zincir üstünde yoksa
              // AI ajan, tx oluştururken minOut'u policy'den türetilmiş eşiğe göre ayarlamalı.  [oai_citation:3‡Algorand Developer Portal](https://dev.algorand.co/reference/algorand-typescript/api-reference/op/functions/btoi/?utm_source=chatgpt.com)
            }
          }
        }
        i = i + Uint64(1);
      }
      assert(hasAllowed, "no allowed application");
  
      // Aynı sender + rekey/close yasak + amount limitleri
      const s0 = gtxn.Transaction(Uint64(0)).sender;
  
      i = Uint64(0);
      while (i < n) {
        const t = gtxn.Transaction(i);
        assert(t.sender === s0, "mixed senders");
        assert(t.rekeyTo === Account(), "rekey not allowed");
  
        if (t.type === TransactionType.Payment) {
          const p = gtxn.PaymentTxn(i);
          assert(p.amount <= this.maxAmountMicroAlgo.value, "payment too big");
          assert(p.closeRemainderTo === Account(), "close-to not allowed");
        }
        if (t.type === TransactionType.AssetTransfer) {
          const a = gtxn.AssetTransferTxn(i);
          assert(a.assetAmount <= this.maxAmountMicroAlgo.value, "asset transfer too big");
          assert(a.assetCloseTo === Account(), "asset close-to not allowed");
        }
        i = i + Uint64(1);
      }
    }
  }