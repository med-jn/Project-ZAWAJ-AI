// ══════════════════════════════════════════════════════════════
// 📁 supabase/functions/deduct-gift-coins/index.ts — ZAWAJ AI v2
// ✅ أضيف voice_message: 10 نقاط
// ══════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const COSTS = {
  like: 5,
  pass: 1,
  view: 1,
  message: 10,
  voice_message: 10
};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: CORS
  });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({
      success: false,
      error: 'unauthorized'
    }, 401);
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: {
        persistSession: false
      }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return json({
      success: false,
      error: 'unauthorized'
    }, 401);
    const body = await req.json();
    const { action, target_id, notes } = body;
    const cost = COSTS[action];
    if (cost === undefined) return json({
      success: false,
      error: 'invalid_action'
    }, 400);
    if (target_id && target_id === user.id) return json({
      success: false,
      error: 'self_interaction'
    }, 400);
    const { data: wallet, error: walletError } = await supabaseAdmin.from('wallets').select('balance_free').eq('id', user.id).single();
    if (walletError || !wallet) return json({
      success: false,
      error: 'wallet_not_found'
    }, 404);
    const currentBalance = wallet.balance_free ?? 0;
    if (currentBalance < cost) {
      return json({
        success: false,
        error: 'insufficient_balance',
        balance_free: currentBalance,
        required: cost
      }, 402);
    }
    const newBalance = currentBalance - cost;
    const { data: updated, error: updateError } = await supabaseAdmin.from('wallets').update({
      balance_free: newBalance,
      updated_at: new Date().toISOString()
    }).eq('id', user.id).gte('balance_free', cost).select('balance_free').single();
    if (updateError || !updated) {
      return json({
        success: false,
        error: 'insufficient_balance',
        balance_free: currentBalance,
        required: cost
      }, 402);
    }
    const { error: txError } = await supabaseAdmin.from('gift_transactions').insert({
      user_id: user.id,
      action,
      target_id: target_id ?? null,
      amount: -cost,
      balance_after: updated.balance_free,
      source: 'action',
      notes: notes ?? action
    });
    if (txError) console.error('[deduct-gift-coins] tx log error:', txError.message);
    return json({
      success: true,
      action,
      cost,
      balance_free: updated.balance_free
    });
  } catch (err) {
    console.error('[deduct-gift-coins] unexpected error:', err);
    return json({
      success: false,
      error: 'server_error'
    }, 500);
  }
});
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json'
    }
  });
}
