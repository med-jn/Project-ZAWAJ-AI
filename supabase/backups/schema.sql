


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_bonus_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_balance_free integer;
  v_max_free     integer := 1000;
  v_actual_add   integer;
BEGIN
  SELECT balance_free INTO v_balance_free
  FROM wallets WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  v_actual_add := LEAST(p_amount, v_max_free - v_balance_free);

  IF v_actual_add <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'max_free_reached');
  END IF;

  UPDATE wallets
  SET balance_free = balance_free + v_actual_add, last_active_at = now()
  WHERE id = p_user_id;

  INSERT INTO point_transactions (id, amount, transaction_type, reason)
  VALUES (p_user_id, v_actual_add, 'add', p_desc);

  RETURN jsonb_build_object('success', true, 'added', v_actual_add);
END;
$$;


ALTER FUNCTION "public"."add_bonus_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_points"("p_user_id" "uuid", "p_amount" integer, "p_type" "text" DEFAULT 'add'::"text", "p_note" "text" DEFAULT ''::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.point_transactions (user_id, transaction_type, amount, reason, created_at)
  VALUES (p_user_id, 'add', p_amount, p_note, now());
END;
$$;


ALTER FUNCTION "public"."add_points"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_welcome_bonus"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.point_transactions
    WHERE id = NEW.id AND reason = 'welcome_gift'
  ) THEN
    UPDATE public.wallets
    SET balance_free = balance_free + 100
    WHERE id = NEW.id;

    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (NEW.id, 100, 'add', 'welcome_gift');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."apply_welcome_bonus"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    lvl INTEGER;
    max_level CONSTANT INTEGER := 50;
    max_subscribers CONSTANT NUMERIC := 2000;
BEGIN

    IF subscribers_count <= 0 THEN
        RETURN 'Level 1';
    END IF;

    /*
        توزيع شبه أسي:
        المستويات الأولى أسهل
        والأخيرة أصعب
    */

    lvl := FLOOR(
        POWER(
            subscribers_count / max_subscribers::NUMERIC,
            0.5
        ) * max_level
    );

    -- حماية الحدود
    IF lvl < 1 THEN
        lvl := 1;
    END IF;

    IF lvl > max_level THEN
        lvl := max_level;
    END IF;

    RETURN 'Level ' || lvl;

END;
$$;


ALTER FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_report"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
declare
  reports_count integer;
begin

  select count(*)
  into reports_count
  from reports
  where reporter_id = user_id
  and created_at >= now() - interval '24 hours';

  return reports_count < 15;

end;
$$;


ALTER FUNCTION "public"."can_create_report"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_daily_reward"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID := auth.uid();
    last_login DATE;
BEGIN
    SELECT last_daily_login INTO last_login FROM public.wallets WHERE id = user_id;

    IF last_login < CURRENT_DATE THEN
        UPDATE public.wallets 
        SET balance = balance + 50,
            last_daily_login = CURRENT_DATE
        WHERE id = user_id;

        RETURN json_build_object('success', true, 'reward', 50);
    END IF;

    RETURN json_build_object('success', false);
END;
$$;


ALTER FUNCTION "public"."check_daily_reward"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_for_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- إذا وجدنا أن الطرف الآخر معجب أصلاً بهذا المستخدم
    IF EXISTS (
        SELECT 1 FROM public.likes 
        WHERE from_user = NEW.to_user AND to_user = NEW.from_user
    ) THEN
        -- نحدث السجلين ليصبحا Match
        UPDATE public.likes SET is_match = TRUE 
        WHERE (from_user = NEW.from_user AND to_user = NEW.to_user)
           OR (from_user = NEW.to_user AND to_user = NEW.from_user);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_for_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_match_on_like"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- هل الشخص الذي أعجبت به (NEW.to_user) قد أعجب بك سابقاً (from_user)؟
    IF EXISTS (
        SELECT 1 FROM public.likes 
        WHERE from_user = NEW.to_user 
          AND to_user = NEW.from_user 
          AND action = 'like' -- نتحقق أنه لايك وليس ديسلايك
    ) THEN
        -- نعم! حدث توافق. نحدث السجلين فوراً
        UPDATE public.likes SET is_match = TRUE 
        WHERE (from_user = NEW.from_user AND to_user = NEW.to_user)
           OR (from_user = NEW.to_user AND to_user = NEW.from_user);
        
        -- ملاحظة: يمكنك هنا أيضاً إضافة كود لإرسال إشعار تلقائي (Notification)
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_match_on_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_activity_reward"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID := auth.uid();
    last_act TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_active_at INTO last_act FROM public.wallets WHERE id = user_id;

    -- التأكد أن الفارق بين الآن وآخر مكافأة هو 5 دقائق على الأقل
    IF (NOW() - last_act) >= INTERVAL '5 minutes' THEN
        UPDATE public.wallets 
        SET balance = balance + 1,
            last_active_at = NOW()
        WHERE id = user_id;

        RETURN json_build_object('success', true, 'message', 'حصلت على نقطة نشاط');
    ELSE
        RETURN json_build_object('success', false, 'message', 'لم تمر 5 دقائق بعد');
    END IF;
END;
$$;


ALTER FUNCTION "public"."claim_activity_reward"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_last_reward  date;
  v_today        date;
  v_reset_hour   integer := 5;
  v_bonus        integer := 30;
BEGIN
  v_today := (now() AT TIME ZONE 'UTC')::date;
  IF EXTRACT(HOUR FROM now() AT TIME ZONE 'UTC') < v_reset_hour THEN
    v_today := v_today - interval '1 day';
  END IF;

  SELECT last_daily_login INTO v_last_reward
  FROM wallets WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'wallet_not_found'; END IF;

  IF v_last_reward >= v_today THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed', 'message', 'استلمت مكافأتك اليوم بالفعل! 🎁');
  END IF;

  UPDATE wallets
  SET balance_free = LEAST(balance_free + v_bonus, 1000),
      last_daily_login = (now() AT TIME ZONE 'UTC')::date
  WHERE id = p_user_id;

  INSERT INTO point_transactions (id, amount, transaction_type, reason)
  VALUES (p_user_id, v_bonus, 'add', 'مكافأة تسجيل يومية');

  RETURN jsonb_build_object('success', true, 'added', v_bonus, 'message', 'تم إضافة ' || v_bonus || ' نقطة مكافأة! 🎉');
END;
$$;


ALTER FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_old_unmatched_likes"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM public.likes
    WHERE is_match = FALSE 
      AND created_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_unmatched_likes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_inactive_accounts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  rec       RECORD;
  cutoff    TIMESTAMP WITH TIME ZONE := now() - INTERVAL '2 months';
  max_batch INT := 10; -- نحذف 10 كحد أقصى في كل مرة لتجنب التأخير
  deleted   INT := 0;
BEGIN
  FOR rec IN
    SELECT id FROM public.profiles
    WHERE
      last_active_at < cutoff
      AND role NOT IN ('admin', 'moderator')
      AND created_at  < cutoff
      AND account_status != 'deleted'
    ORDER BY last_active_at ASC
    LIMIT max_batch
  LOOP
    INSERT INTO public.account_deletion_requests (user_id, reason, status)
    VALUES (rec.id, 'auto_inactive_2months', 'completed')
    ON CONFLICT DO NOTHING;

    DELETE FROM public.notifications  WHERE id = rec.id OR from_user = rec.id OR to_user = rec.id;
    DELETE FROM public.messages       WHERE sender_id = rec.id;
    DELETE FROM public.conversations  WHERE user_1 = rec.id OR user_2 = rec.id;
    DELETE FROM public.likes          WHERE from_user = rec.id OR to_user = rec.id;
    DELETE FROM public.blocks         WHERE blocker_id = rec.id OR blocked_id = rec.id;
    DELETE FROM public.fcm_tokens     WHERE user_id = rec.id;
    DELETE FROM public.auth_handshakes WHERE user_id = rec.id;
    DELETE FROM public.point_transactions WHERE user_id = rec.id;
    DELETE FROM public.purchased_points   WHERE user_id = rec.id;
    UPDATE public.konnect_payments SET user_id = NULL WHERE user_id = rec.id;
    DELETE FROM public.mediator_clients       WHERE user_id = rec.id;
    DELETE FROM public.mediator_subscriptions WHERE id     = rec.id;
    DELETE FROM public.reports  WHERE reporter_id = rec.id;
    DELETE FROM public.wallets  WHERE id = rec.id;
    DELETE FROM public.profiles WHERE id = rec.id;

    deleted := deleted + 1;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."cleanup_inactive_accounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_inactive_fcm_tokens"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- تعطيل tokens لم تُستخدم منذ 60 يوم
  update fcm_tokens
  set    is_active = false
  where  last_opened_at < now() - interval '60 days'
    and  is_active = true;

  -- حذف tokens معطّلة منذ أكثر من 90 يوم
  delete from fcm_tokens
  where  is_active = false
    and  last_opened_at < now() - interval '90 days';
end;
$$;


ALTER FUNCTION "public"."cleanup_inactive_fcm_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mediator_pricing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role = 'mediator' AND (OLD.role IS DISTINCT FROM 'mediator') THEN
    INSERT INTO mediator_pricing (mediator_id)
    VALUES (NEW.id)
    ON CONFLICT (mediator_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_mediator_pricing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mediator_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.role = 'mediator' THEN

    INSERT INTO mediator_wallets (mediator_id, total_coins)
    VALUES (NEW.id, 0)
    ON CONFLICT (mediator_id) DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_mediator_wallet"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification_on_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  recipient_id UUID;
  sender_name  TEXT;
BEGIN
  SELECT CASE
    WHEN user_1 = NEW.sender_id THEN user_2
    ELSE user_1
  END INTO recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  SELECT full_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (id, type, from_user, title, message, conversation_id, created_at)
  VALUES (
    recipient_id,
    'message',
    NEW.sender_id,
    sender_name,
    NEW.content,
    NEW.conversation_id,
    NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_notification_on_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_wallet_on_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- wallet عادية — ON CONFLICT لأنها قد تكون موجودة
  INSERT INTO wallets (id, balance, balance_free, user_name, updated_at)
  VALUES (NEW.id, 0, 100, NEW.full_name, now())
  ON CONFLICT (id) DO UPDATE
    SET user_name  = COALESCE(EXCLUDED.user_name, wallets.user_name),
        updated_at = now();

  -- mediator_wallet لو كان الدور وسيط
  IF NEW.role = 'mediator' THEN
    INSERT INTO mediator_wallets (
      mediator_id, user_name,
      total_coins, total_tnd, pending_tnd, paid_tnd,
      updated_at
    )
    VALUES (NEW.id, NEW.full_name, 0, 0, 0, 0, now())
    ON CONFLICT (mediator_id) DO UPDATE
      SET user_name  = COALESCE(EXCLUDED.user_name, mediator_wallets.user_name),
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_wallet_on_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_points"("activity_type" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_id UUID := auth.uid();
    cost INTEGER;
    current_balance INTEGER;
BEGIN
    -- تحديد التكلفة بناءً على نوع النشاط
    cost := CASE 
        WHEN activity_type = 'swipe_back' THEN 3
        WHEN activity_type = 'like' THEN 7
        WHEN activity_type = 'first_message' THEN 20
        ELSE 0
    END;

    -- الحصول على الرصيد الحالي
    SELECT balance INTO current_balance FROM public.wallets WHERE id = user_id;

    -- التحقق من كفاية الرصيد
    IF current_balance < cost THEN
        RETURN json_build_object('success', false, 'message', 'رصيد نقاطك غير كافٍ');
    END IF;

    -- تنفيذ الخصم
    UPDATE public.wallets 
    SET balance = balance - cost 
    WHERE id = user_id;

    -- تسجيل العملية في جدول Transactions
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (user_id, cost, 'deduction', activity_type);

    RETURN json_build_object('success', true, 'new_balance', current_balance - cost);
END;
$$;


ALTER FUNCTION "public"."deduct_points"("activity_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_balance      integer;
  v_balance_free integer;
  v_paid_deduct  integer;
  v_bonus_deduct integer;
BEGIN

  -- ── 1. قفل الصف لمنع التزامن المتعارض (Race Condition) ──
  SELECT balance, balance_free
    INTO v_balance, v_balance_free
    FROM wallets
   WHERE id = p_user_id
     FOR UPDATE;

  -- ── 2. التحقق من وجود المحفظة ──
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found'
      USING HINT = 'لم يتم العثور على محفظة لهذا المستخدم';
  END IF;

  -- ── 3. التحقق من كفاية الرصيد الإجمالي ──
  IF (v_balance + v_balance_free) < p_amount THEN
    RAISE EXCEPTION 'insufficient_funds'
      USING HINT = 'الرصيد غير كافٍ لإتمام العملية';
  END IF;

  -- ── 4. حساب التوزيع: paid أولاً ثم bonus ──
  v_paid_deduct  := LEAST(v_balance, p_amount);
  v_bonus_deduct := p_amount - v_paid_deduct;

  -- ── 5. تحديث المحفظة ──
  UPDATE wallets
     SET balance      = balance      - v_paid_deduct,
         balance_free = balance_free - v_bonus_deduct,
         last_active_at = now()
   WHERE id = p_user_id;

  -- ── 6. تسجيل المعاملة في point_transactions ──
  INSERT INTO point_transactions (id, amount, transaction_type, reason)
  VALUES (p_user_id, -p_amount, 'withdrawal', p_desc);

  -- ── 7. إرجاع نتيجة النجاح ──
  RETURN jsonb_build_object('success', true);

END;
$$;


ALTER FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_listened_voice_messages"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM messages
  WHERE message_type = 'voice'
    AND listened_at IS NOT NULL
    AND listened_at < now() - interval '30 seconds';
END;
$$;


ALTER FUNCTION "public"."delete_listened_voice_messages"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_my_account"("p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
BEGIN

  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'غير مصرح'
    );
  END IF;

  -- حفظ سجل الحذف
  INSERT INTO public.account_deletion_requests (
    user_id,
    reason,
    status
  )
  VALUES (
    v_user_id,
    p_reason,
    'completed'
  )
  ON CONFLICT DO NOTHING;

  -- =====================================================
  -- تنظيف الجداول المرتبطة
  -- =====================================================

  DELETE FROM public.notifications
  WHERE id = v_user_id
     OR from_user = v_user_id
     OR to_user = v_user_id;

  DELETE FROM public.likes
  WHERE from_user = v_user_id
     OR to_user = v_user_id;

  DELETE FROM public.blocks
  WHERE blocker_id = v_user_id
     OR blocked_id = v_user_id;

  DELETE FROM public.messages
  WHERE sender_id = v_user_id;

  DELETE FROM public.conversations
  WHERE user_1 = v_user_id
     OR user_2 = v_user_id;

  DELETE FROM public.fcm_tokens
  WHERE user_id = v_user_id;

  DELETE FROM public.auth_handshakes
  WHERE user_id = v_user_id;

  DELETE FROM public.purchased_points
  WHERE user_id = v_user_id;

  DELETE FROM public.content_moderation_logs
  WHERE user_id = v_user_id;

  -- =====================================================
  -- mediator
  -- =====================================================

  DELETE FROM public.mediator_notes
  WHERE id = v_user_id
     OR mediator_id = v_user_id;

  DELETE FROM public.mediator_subscriber_info
  WHERE mediator_id = v_user_id
     OR subscriber_id = v_user_id;

  DELETE FROM public.mediator_pricing
  WHERE mediator_id = v_user_id;

  DELETE FROM public.mediator_reviews
  WHERE id = v_user_id
     OR mediator_id = v_user_id;

  -- =====================================================
  -- subscriptions
  -- =====================================================

  DELETE FROM public.subscriptions
  WHERE id = v_user_id
     OR mediator_id = v_user_id;

  -- =====================================================
  -- الأموال والمدفوعات
  -- =====================================================

  UPDATE public.konnect_payments
  SET user_id = NULL
  WHERE user_id = v_user_id;

  DELETE FROM public.point_transactions
  WHERE user_id = v_user_id;

  -- =====================================================
  -- wallet
  -- =====================================================

  DELETE FROM public.wallets
  WHERE id = v_user_id;

  -- =====================================================
  -- profile
  -- =====================================================

  DELETE FROM public.profiles
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id::TEXT
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."delete_my_account"("p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."disable_my_account"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح');
  END IF;

  -- تعطيل الحساب
  UPDATE public.profiles
  SET
    account_status = 'disabled',
    disabled_at    = now()
  WHERE id = v_user_id
    AND account_status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'الحساب غير موجود أو معطّل مسبقاً');
  END IF;

  -- إلغاء تفعيل رموز FCM حتى لا يتلقى إشعارات
  UPDATE public.fcm_tokens
  SET is_active = false
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'تم تعطيل حسابك بنجاح');
END;
$$;


ALTER FUNCTION "public"."disable_my_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_action"("action_key" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    u_id UUID := auth.uid();
    price INTEGER;
    wal RECORD;
BEGIN
    -- تحديد الأسعار (يمكنك تعديلها هنا بسهولة)
    price := CASE 
        WHEN action_key = 'back_swipe' THEN 3
        WHEN action_key = 'send_like' THEN 7
        WHEN action_key = 'chat_open' THEN 20
        ELSE 999 -- سعر مانع للخطأ
    END;

    SELECT balance, balance_free INTO wal FROM public.wallets WHERE id = u_id FOR UPDATE;

    IF (wal.balance + wal.balance_free) < price THEN
        RETURN json_build_object('success', false, 'reason', 'low_balance');
    END IF;

    -- الخصم من المجاني أولاً
    IF wal.balance_free >= price THEN
        UPDATE public.wallets SET balance_free = balance_free - price WHERE id = u_id;
    ELSE
        UPDATE public.wallets 
        SET balance = balance - (price - wal.balance_free), 
            balance_free = 0 
        WHERE id = u_id;
    END IF;

    -- توثيق العملية
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (u_id, price, 'withdrawal', action_key);

    RETURN json_build_object('success', true, 'new_total', (SELECT balance + balance_free FROM public.wallets WHERE id = u_id));
END;
$$;


ALTER FUNCTION "public"."execute_action"("action_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_user_action"("action_type" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    u_id UUID := auth.uid();
    cost INTEGER;
    current_wal RECORD;
BEGIN
    -- تحديد التكلفة (Swipe Back = 3, Like = 7, Message = 20)
    cost := CASE 
        WHEN action_type = 'swipe_back' THEN 3
        WHEN action_type = 'send_like' THEN 7
        WHEN action_type = 'open_chat' THEN 20
        ELSE 0
    END;

    -- قفل السجل للتحديث (يمنع الخصم المزدوج في نفس اللحظة)
    SELECT balance, balance_free INTO current_wal FROM public.wallets WHERE id = u_id FOR UPDATE;

    IF (current_wal.balance + current_wal.balance_free) < cost THEN
        RETURN json_build_object('success', false, 'error', 'insufficient_funds');
    END IF;

    -- الخصم من الرصيد المجاني أولاً (Free points first)
    IF current_wal.balance_free >= cost THEN
        UPDATE public.wallets SET balance_free = balance_free - cost WHERE id = u_id;
    ELSE
        UPDATE public.wallets 
        SET balance = balance - (cost - current_wal.balance_free), 
            balance_free = 0 
        WHERE id = u_id;
    END IF;

    -- توثيق العملية في جدول point_transactions المذكور في ملفك
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (u_id, cost, 'withdrawal', action_type);

    RETURN json_build_object('success', true, 'remaining', (SELECT balance + balance_free FROM public.wallets WHERE id = u_id));
END;
$$;


ALTER FUNCTION "public"."execute_user_action"("action_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."expire_pending_payments"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE public.konnect_payments
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
$$;


ALTER FUNCTION "public"."expire_pending_payments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mediators"() RETURNS TABLE("id" "uuid", "full_name" "text", "avatar_url" "text", "bio" "text", "city" "text", "country" "text", "mediator_level" "text", "success_count" integer, "avg_rating" numeric, "rating_count" bigint, "male_count" bigint, "female_count" bigint, "total_subscribers" bigint, "whatsapp" "text", "tiktok" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.city,
    p.country,
    p.mediator_level,
    p.success_count,

    -- متوسط التقييم وعدده
    COALESCE(ROUND(AVG(r.rating), 1), 0)   AS avg_rating,
    COUNT(DISTINCT r.review_internal_id)    AS rating_count,

    -- ذكور نشطون الآن (من mediator_subscriptions)
    COUNT(DISTINCT CASE
      WHEN ms.id IS NOT NULL AND sub_p.gender = 'male'
      THEN ms.id
    END) AS male_count,

    -- إناث نشطات الآن (من mediator_subscriptions)
    COUNT(DISTINCT CASE
      WHEN ms.id IS NOT NULL AND sub_p.gender = 'female'
      THEN ms.id
    END) AS female_count,

    -- إجمالي الاشتراكات التاريخية — لا ينقص أبداً
    (SELECT COUNT(*) FROM mediator_clients mc WHERE mc.mediator_id = p.id)
      AS total_subscribers,

    -- معلومات التواصل
    p.whatsapp,
    p.tiktok

  FROM profiles p

  LEFT JOIN mediator_reviews r
    ON r.mediator_id = p.id

  LEFT JOIN mediator_subscriptions ms
    ON  ms.mediator_id = p.id
    AND ms.status      = 'active'
    AND ms.expires_at  > now()

  LEFT JOIN profiles sub_p
    ON sub_p.id = ms.id

  WHERE p.role = 'mediator'

  GROUP BY
    p.id, p.full_name, p.avatar_url, p.bio,
    p.city, p.country, p.mediator_level, p.success_count,
    p.whatsapp, p.tiktok
$$;


ALTER FUNCTION "public"."get_mediators"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" double precision DEFAULT 100, "target_gender" "text" DEFAULT 'female'::"text") RETURNS TABLE("id" "uuid", "full_name" "text", "age" integer, "city" "text", "country" "text", "avatar_url" "text", "distance_km" double precision)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.age,
    p.city,
    p.country,
    p.avatar_url,
    ROUND(
      ST_Distance(
        p.coords,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
      ) / 1000
    )::float AS distance_km
  FROM public.profiles p
  WHERE
    p.gender = target_gender
    AND p.is_completed = true
    AND p.coords IS NOT NULL
    AND ST_DWithin(
      p.coords,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT 200;
END;
$$;


ALTER FUNCTION "public"."get_nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" double precision, "target_gender" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "gender" "text",
    "marital_status" integer,
    "age" integer,
    "is_completed" boolean DEFAULT false,
    "birth_date" "date",
    "country" "text",
    "city" "text",
    "phone" "text",
    "education_level" integer,
    "height" double precision,
    "weight" double precision,
    "religious_commitment" integer,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "bio" "text",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "health_habits" "jsonb" DEFAULT '[]'::"jsonb",
    "is_photos_blurred" boolean DEFAULT false,
    "partner_requirements" "text",
    "readiness_level" integer,
    "housing_type" integer,
    "health_status" "text",
    "desire_for_children" "text",
    "children_count" integer DEFAULT 0,
    "children_custody" "text",
    "financial_status" "text",
    "images_data" "jsonb" DEFAULT '[]'::"jsonb",
    "profile_completion_percent" integer DEFAULT 0,
    "role" "text" DEFAULT 'user'::"text",
    "mediator_id" "uuid",
    "mediator_level" "text" DEFAULT 'none'::"text",
    "success_count" integer DEFAULT 0,
    "daily_likes_count" integer DEFAULT 0,
    "daily_messages_count" integer DEFAULT 0,
    "daily_views_count" integer DEFAULT 0,
    "last_limit_reset" timestamp with time zone DEFAULT "now"(),
    "consecutive_months" integer DEFAULT 0,
    "nationality" "text",
    "has_children" boolean DEFAULT false,
    "skin_color" "text",
    "travel_willingness" "text",
    "relationship_with_family" "text",
    "social_type" "text",
    "morning_evening" "text",
    "home_time" "text",
    "conflict_style" "text",
    "affection_style" "text",
    "life_priority" "text",
    "parenting_style" "text",
    "quran_memorization" "text",
    "marriage_type" "text",
    "preferred_housing" "text",
    "beard_style" "text",
    "prayer_commitment" "text",
    "wife_number" "text",
    "smoking" "text",
    "hijab_style" "text",
    "polygamy_acceptance" "text",
    "work_after_marriage" "text",
    "full_name" "text",
    "occupation_category_id" integer,
    "occupation_id" integer,
    "can_reverse_swipe" boolean DEFAULT false,
    "compatibility_score" integer,
    "last_active_at" timestamp with time zone,
    "profile_views_count" integer DEFAULT 0,
    "show_photos" boolean DEFAULT true,
    "verification_status" "text" DEFAULT 'pending'::"text",
    "ai_feedback" "text",
    "latitude" double precision,
    "longitude" double precision,
    "whatsapp" "text",
    "tiktok" "text",
    "account_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "disabled_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "delete_requested_at" timestamp with time zone,
    "discovery_position" "jsonb",
    "coords" "extensions"."geography"(Point,4326),
    CONSTRAINT "check_verification_status" CHECK (("verification_status" = ANY (ARRAY['approved'::"text", 'pending'::"text", 'rejected'::"text"]))),
    CONSTRAINT "profiles_account_status_check" CHECK (("account_status" = ANY (ARRAY['active'::"text", 'disabled'::"text", 'deleted'::"text"]))),
    CONSTRAINT "profiles_gender_check" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'mediator'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User Profiles Table';



COMMENT ON COLUMN "public"."profiles"."desire_for_children" IS 'الرغبة في الإنجاب: نعم، لا، لاحقاً';



COMMENT ON COLUMN "public"."profiles"."occupation_category_id" IS 'رقم تصنيف المهنة (مثلاً: 1 للطب، 2 للهندسة)';



COMMENT ON COLUMN "public"."profiles"."occupation_id" IS 'رقم المهنة الدقيق (مثلاً: 101 طبيب جراح)';



COMMENT ON COLUMN "public"."profiles"."can_reverse_swipe" IS 'يحدد ما إذا كان للمستخدم الحق في استخدام ميزة التراجع عن السحب حالياً';



CREATE OR REPLACE FUNCTION "public"."get_nearby_users"("user_lat" double precision, "user_lon" double precision, "max_dist_km" double precision) RETURNS SETOF "public"."profiles"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE st_dwithin(
    coords, 
    st_setsrid(st_point(user_lon, user_lat), 4326)::geography, 
    max_dist_km * 1000 -- تحويل الكيلومترات إلى أمتار
  )
  ORDER BY st_distance(
    coords, 
    st_setsrid(st_point(user_lon, user_lat), 4326)::geography
  );
END;
$$;


ALTER FUNCTION "public"."get_nearby_users"("user_lat" double precision, "user_lon" double precision, "max_dist_km" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_activity_point"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    curr_user_id UUID := auth.uid();
    last_act TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT last_activity_at INTO last_act FROM public.wallets WHERE id = curr_user_id;

    -- إذا مر أكثر من 5 دقائق
    IF (NOW() - last_act) >= INTERVAL '5 minutes' THEN
        UPDATE public.wallets 
        SET balance_free = balance_free + 1,
            last_activity_at = NOW()
        WHERE id = curr_user_id;
        
        RETURN json_build_object('success', true, 'message', 'تم منح نقطة نشاط');
    END IF;

    RETURN json_build_object('success', false, 'message', 'انتظر قليلاً');
END;
$$;


ALTER FUNCTION "public"."grant_activity_point"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_total INTEGER;
    new_level TEXT;
BEGIN

    /*
        زيادة تراكمية فقط
        لا يوجد أي نقصان نهائياً
    */

    UPDATE mediator_wallets
    SET total_subscribers = COALESCE(total_subscribers, 0) + 1
    WHERE mediator_id = NEW.mediator_id
    RETURNING total_subscribers INTO new_total;

    -- حساب المستوى الجديد
    new_level := calculate_mediator_level(new_total);

    -- تحديث المستوى
    UPDATE mediator_wallets
    SET current_level = new_level
    WHERE mediator_id = NEW.mediator_id;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, is_completed, created_at, updated_at)
  VALUES (new.id, false, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_payment_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_name        text;
  v_avatar      text;
  v_new_balance integer;
BEGIN
  -- فقط عند الانتقال pending/failed → completed
  IF NEW.status = 'completed'
     AND (OLD.status IS DISTINCT FROM 'completed') THEN

    -- جيب اسم وصورة المستخدم
    SELECT full_name, avatar_url
    INTO   v_name, v_avatar
    FROM   profiles
    WHERE  id = NEW.user_id;

    -- أضف الرصيد
    INSERT INTO wallets (id, balance, user_name, updated_at)
    VALUES (NEW.user_id, NEW.coins_amount, v_name, now())
    ON CONFLICT (id) DO UPDATE
      SET balance    = wallets.balance + EXCLUDED.balance,
          user_name  = COALESCE(EXCLUDED.user_name, wallets.user_name),
          updated_at = now()
    RETURNING balance INTO v_new_balance;

    -- سجّل في point_transactions بالأعمدة الصحيحة
    -- (transaction_id يُنشأ تلقائياً، لا يوجد عمود "id" أو "reason")
    INSERT INTO point_transactions (
      user_id,
      amount,
      balance_after,
      source,           -- ← الصحيح وليس "reason"
      action,
      payment_id,       -- ← UUID من konnect_payments.payment_id
      user_name,
      user_avatar,
      notes,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.coins_amount,
      v_new_balance,
      'konnect',
      'purchase',
      NEW.payment_id,
      v_name,
      v_avatar,
      'شراء عبر Konnect — ' || COALESCE(NEW.konnect_ref, NEW.payment_id::text),
      now()
    );

    -- أنشئ سجل في purchased_points للـ FIFO
    INSERT INTO purchased_points (
      user_id, payment_id,
      coins_total, coins_remaining,
      tnd_total, tnd_per_coin,
      created_at
    ) VALUES (
      NEW.user_id,
      NEW.payment_id,
      NEW.coins_amount,
      NEW.coins_amount,
      NEW.tnd_amount,
      ROUND(NEW.tnd_amount::numeric / NEW.coins_amount, 6),
      now()
    )
    ON CONFLICT DO NOTHING;

  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_payment_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_payout_approved"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_pending numeric;
  v_new_paid    numeric;
  v_med_name    text;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN

    -- جيب اسم الوسيط
    SELECT full_name INTO v_med_name
    FROM profiles WHERE id = NEW.mediator_id;

    -- تحديث mediator_wallets: خصم من pending وإضافة لـ paid
    UPDATE mediator_wallets
    SET
      pending_tnd = GREATEST(pending_tnd - NEW.amount, 0),
      paid_tnd    = paid_tnd + NEW.amount,
      updated_at  = now()
    WHERE mediator_id = NEW.mediator_id
    RETURNING pending_tnd, paid_tnd
    INTO v_new_pending, v_new_paid;

    -- سجّل في point_transactions
    INSERT INTO point_transactions (
      mediator_id,
      amount,
      balance_after,
      source,
      action,
      value_tnd,
      notes,
      created_at
    ) VALUES (
      NEW.mediator_id,
      0,
      (SELECT total_coins FROM mediator_wallets WHERE mediator_id = NEW.mediator_id),
      'payout',
      'withdrawal',
      -NEW.amount,
      'سحب مبلغ ' || NEW.amount || ' ' || COALESCE(NEW.currency, 'TND') ||
        CASE WHEN NEW.admin_note IS NOT NULL THEN ' — ' || NEW.admin_note ELSE '' END,
      now()
    );

    -- تسجيل وقت الدفع إن لم يكن محدداً
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;

  END IF;

  -- عند الرفض
  IF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.rejected_at := now();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_payout_approved"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" integer, "target_gender" "text", "excluded_ids" "uuid"[] DEFAULT '{}'::"uuid"[], "p_marital_status" integer[] DEFAULT '{}'::integer[], "p_education_level" integer[] DEFAULT '{}'::integer[], "p_religious_commitment" integer[] DEFAULT '{}'::integer[], "p_readiness_level" integer[] DEFAULT '{}'::integer[], "p_occupation_cat" integer[] DEFAULT '{}'::integer[], "p_housing_type" integer[] DEFAULT '{}'::integer[], "p_age_min" integer DEFAULT 18, "p_age_max" integer DEFAULT 80, "p_height_min" integer DEFAULT 140, "p_height_max" integer DEFAULT 210, "p_weight_min" integer DEFAULT 40, "p_weight_max" integer DEFAULT 150, "p_financial_status" "text"[] DEFAULT '{}'::"text"[], "p_skin_color" "text"[] DEFAULT '{}'::"text"[], "p_travel_willingness" "text"[] DEFAULT '{}'::"text"[], "p_desire_for_children" "text"[] DEFAULT '{}'::"text"[], "p_health_status" "text"[] DEFAULT '{}'::"text"[], "p_smoking" "text"[] DEFAULT '{}'::"text"[], "p_hijab_style" "text"[] DEFAULT '{}'::"text"[], "p_beard_style" "text"[] DEFAULT '{}'::"text"[], "p_prayer_commitment" "text"[] DEFAULT '{}'::"text"[], "p_quran_memorization" "text"[] DEFAULT '{}'::"text"[], "p_polygamy_acceptance" "text"[] DEFAULT '{}'::"text"[], "p_work_after_marriage" "text"[] DEFAULT '{}'::"text"[], "p_preferred_housing" "text"[] DEFAULT '{}'::"text"[], "p_social_type" "text"[] DEFAULT '{}'::"text"[], "p_morning_evening" "text"[] DEFAULT '{}'::"text"[], "p_conflict_style" "text"[] DEFAULT '{}'::"text"[], "p_affection_style" "text"[] DEFAULT '{}'::"text"[], "p_life_priority" "text"[] DEFAULT '{}'::"text"[], "p_parenting_style" "text"[] DEFAULT '{}'::"text"[], "p_relationship_with_family" "text"[] DEFAULT '{}'::"text"[]) RETURNS TABLE("id" "uuid", "full_name" "text", "gender" "text", "age" integer, "country" "text", "city" "text", "avatar_url" "text", "images_data" "jsonb", "is_photos_blurred" boolean, "readiness_level" integer, "profile_completion_percent" integer, "occupation_id" integer, "occupation_category_id" integer, "marital_status" integer, "education_level" integer, "religious_commitment" integer, "housing_type" integer, "financial_status" "text", "health_status" "text", "desire_for_children" "text", "children_count" integer, "children_custody" "text", "travel_willingness" "text", "skin_color" "text", "height" double precision, "weight" double precision, "nationality" "text", "bio" "text", "partner_requirements" "text", "quran_memorization" "text", "beard_style" "text", "prayer_commitment" "text", "hijab_style" "text", "polygamy_acceptance" "text", "work_after_marriage" "text", "smoking" "text", "social_type" "text", "morning_evening" "text", "home_time" "text", "conflict_style" "text", "affection_style" "text", "life_priority" "text", "parenting_style" "text", "relationship_with_family" "text", "interests" "jsonb", "health_habits" "jsonb", "birth_date" "date", "is_completed" boolean, "role" "text", "distance_km" double precision)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    p.id,
    p.full_name,
    p.gender,
    p.age,
    p.country,
    p.city,
    p.avatar_url,
    p.images_data,
    p.is_photos_blurred,
    p.readiness_level,
    p.profile_completion_percent,
    p.occupation_id,
    p.occupation_category_id,
    p.marital_status,
    p.education_level,
    p.religious_commitment,
    p.housing_type,
    p.financial_status,
    p.health_status,
    p.desire_for_children,
    p.children_count,
    p.children_custody,
    p.travel_willingness,
    p.skin_color,
    p.height,
    p.weight,
    p.nationality,
    p.bio,
    p.partner_requirements,
    p.quran_memorization,
    p.beard_style,
    p.prayer_commitment,
    p.hijab_style,
    p.polygamy_acceptance,
    p.work_after_marriage,
    p.smoking,
    p.social_type,
    p.morning_evening,
    p.home_time,
    p.conflict_style,
    p.affection_style,
    p.life_priority,
    p.parenting_style,
    p.relationship_with_family,
    p.interests,
    p.health_habits,
    p.birth_date,
    p.is_completed,
    p.role,

    -- المسافة بالكيلومتر
    ROUND(
      ST_Distance(
        p.coords::geography,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
      ) / 1000.0
    )::float8 AS distance_km

  FROM profiles p

  WHERE
    p.gender        = target_gender
    AND p.is_completed = true
    AND (p.role IS NULL OR p.role = 'user')
    AND p.coords IS NOT NULL

    -- ✅ الفلترة الجغرافية
    AND ST_DWithin(
      p.coords::geography,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      (radius_km * 1000)::float8
    )

    -- استثناء IDs
    AND (
      cardinality(excluded_ids) = 0
      OR p.id != ALL(excluded_ids)
    )

    -- فلاتر رقمية
    AND (cardinality(p_marital_status)       = 0 OR p.marital_status          = ANY(p_marital_status))
    AND (cardinality(p_education_level)      = 0 OR p.education_level         = ANY(p_education_level))
    AND (cardinality(p_religious_commitment) = 0 OR p.religious_commitment    = ANY(p_religious_commitment))
    AND (cardinality(p_readiness_level)      = 0 OR p.readiness_level         = ANY(p_readiness_level))
    AND (cardinality(p_occupation_cat)       = 0 OR p.occupation_category_id  = ANY(p_occupation_cat))
    AND (cardinality(p_housing_type)         = 0 OR p.housing_type            = ANY(p_housing_type))

    -- نطاقات (نتجاهل الصفوف التي قيمتها NULL)
    AND (p.age    IS NULL OR p.age    BETWEEN p_age_min    AND p_age_max)
    AND (p.height IS NULL OR p.height BETWEEN p_height_min AND p_height_max)
    AND (p.weight IS NULL OR p.weight BETWEEN p_weight_min AND p_weight_max)

    -- فلاتر نصية
    AND (cardinality(p_financial_status)         = 0 OR p.financial_status         = ANY(p_financial_status))
    AND (cardinality(p_skin_color)               = 0 OR p.skin_color               = ANY(p_skin_color))
    AND (cardinality(p_travel_willingness)       = 0 OR p.travel_willingness       = ANY(p_travel_willingness))
    AND (cardinality(p_desire_for_children)      = 0 OR p.desire_for_children      = ANY(p_desire_for_children))
    AND (cardinality(p_health_status)            = 0 OR p.health_status            = ANY(p_health_status))
    AND (cardinality(p_smoking)                  = 0 OR p.smoking                  = ANY(p_smoking))
    AND (cardinality(p_hijab_style)              = 0 OR p.hijab_style              = ANY(p_hijab_style))
    AND (cardinality(p_beard_style)              = 0 OR p.beard_style              = ANY(p_beard_style))
    AND (cardinality(p_prayer_commitment)        = 0 OR p.prayer_commitment        = ANY(p_prayer_commitment))
    AND (cardinality(p_quran_memorization)       = 0 OR p.quran_memorization       = ANY(p_quran_memorization))
    AND (cardinality(p_polygamy_acceptance)      = 0 OR p.polygamy_acceptance      = ANY(p_polygamy_acceptance))
    AND (cardinality(p_work_after_marriage)      = 0 OR p.work_after_marriage      = ANY(p_work_after_marriage))
    AND (cardinality(p_preferred_housing)        = 0 OR p.preferred_housing        = ANY(p_preferred_housing))
    AND (cardinality(p_social_type)              = 0 OR p.social_type              = ANY(p_social_type))
    AND (cardinality(p_morning_evening)          = 0 OR p.morning_evening          = ANY(p_morning_evening))
    AND (cardinality(p_conflict_style)           = 0 OR p.conflict_style           = ANY(p_conflict_style))
    AND (cardinality(p_affection_style)          = 0 OR p.affection_style          = ANY(p_affection_style))
    AND (cardinality(p_life_priority)            = 0 OR p.life_priority            = ANY(p_life_priority))
    AND (cardinality(p_parenting_style)          = 0 OR p.parenting_style          = ANY(p_parenting_style))
    AND (cardinality(p_relationship_with_family) = 0 OR p.relationship_with_family = ANY(p_relationship_with_family))

  ORDER BY distance_km ASC
  LIMIT 200;
$$;


ALTER FUNCTION "public"."nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" integer, "target_gender" "text", "excluded_ids" "uuid"[], "p_marital_status" integer[], "p_education_level" integer[], "p_religious_commitment" integer[], "p_readiness_level" integer[], "p_occupation_cat" integer[], "p_housing_type" integer[], "p_age_min" integer, "p_age_max" integer, "p_height_min" integer, "p_height_max" integer, "p_weight_min" integer, "p_weight_max" integer, "p_financial_status" "text"[], "p_skin_color" "text"[], "p_travel_willingness" "text"[], "p_desire_for_children" "text"[], "p_health_status" "text"[], "p_smoking" "text"[], "p_hijab_style" "text"[], "p_beard_style" "text"[], "p_prayer_commitment" "text"[], "p_quran_memorization" "text"[], "p_polygamy_acceptance" "text"[], "p_work_after_marriage" "text"[], "p_preferred_housing" "text"[], "p_social_type" "text"[], "p_morning_evening" "text"[], "p_conflict_style" "text"[], "p_affection_style" "text"[], "p_life_priority" "text"[], "p_parenting_style" "text"[], "p_relationship_with_family" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_on_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.action NOT IN ('like', 'view') THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (id, type, from_user, title, message)
  VALUES (
    NEW.to_user,
    NEW.action,
    NEW.from_user,
    CASE NEW.action WHEN 'like' THEN 'إعجاب جديد' ELSE 'زيارة جديدة' END,
    CASE NEW.action WHEN 'like' THEN 'أعجب أحدهم بملفك' ELSE 'زار أحدهم ملفك' END
  );

  IF NEW.action = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM likes
      WHERE from_user = NEW.to_user
        AND to_user   = NEW.from_user
        AND action    = 'like'
    ) THEN
      UPDATE likes SET is_match = true
      WHERE (from_user = NEW.from_user AND to_user = NEW.to_user)
         OR (from_user = NEW.to_user   AND to_user = NEW.from_user);

      INSERT INTO notifications (id, type, from_user, title, message)
      VALUES
        (NEW.to_user,   'match', NEW.from_user, 'تطابق! 💍', 'تطابقتما — يمكنكما التواصل'),
        (NEW.from_user, 'match', NEW.to_user,   'تطابق! 💍', 'تطابقتما — يمكنكما التواصل');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_on_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    sender_wallet_id UUID;
    receiver_wallet_id UUID;
BEGIN
    -- ✅ تحقق أن المستدعي هو المُرسل فعلاً
    IF sender_uid != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: sender mismatch';
    END IF;

    SELECT id INTO sender_wallet_id FROM wallets WHERE user_id = sender_uid;
    SELECT id INTO receiver_wallet_id FROM wallets WHERE user_id = receiver_uid;

    UPDATE wallets 
    SET paid_balance = paid_balance - points_amount, updated_at = NOW()
    WHERE user_id = sender_uid AND paid_balance >= points_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'عذراً، هذه الخدمة تتطلب نقاطاً مشتراة. رصيد المكافآت لا يمكن استخدامه هنا.';
    END IF;

    UPDATE wallets 
    SET paid_balance = paid_balance + points_amount, updated_at = NOW()
    WHERE user_id = receiver_uid;

    INSERT INTO point_transactions (wallet_id, amount, balance_type, transaction_type, description, receiver_wallet_id)
    VALUES (sender_wallet_id, -points_amount, 'paid', 'mediator_service', service_name, receiver_wallet_id);

    INSERT INTO point_transactions (wallet_id, amount, balance_type, transaction_type, description)
    VALUES (receiver_wallet_id, points_amount, 'paid', 'income_from_user', 'أرباح من خدمة وساطة');
END;
$$;


ALTER FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_sensitive_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.role := OLD.role;
    NEW.mediator_level := OLD.mediator_level;
    NEW.success_count := OLD.success_count;
    NEW.verification_status := OLD.verification_status;
    NEW.can_reverse_swipe := OLD.can_reverse_swipe;
    NEW.consecutive_months := OLD.consecutive_months;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_profile_sensitive_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_account"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- فقط الإدمن يستطيع استخدام هذه الدالة
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'غير مصرح');
  END IF;

  UPDATE public.profiles
  SET account_status = 'active', disabled_at = NULL
  WHERE id = p_user_id AND account_status = 'disabled';

  UPDATE public.fcm_tokens
  SET is_active = true
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."reactivate_account"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- تجنب التكرار
  INSERT INTO mediator_subscriptions (id, mediator_id, tier, status, expires_at)
  VALUES (p_user_id, p_mediator_id, 'pending', 'pending', null)
  ON CONFLICT (id, mediator_id) DO NOTHING;

  -- إشعار للوسيط
  INSERT INTO notifications (id, from_user, type, title, message)
  VALUES (
    p_mediator_id,
    p_user_id,
    'mediation_request',
    'طلب وساطة جديد',
    COALESCE(p_message, 'يطلب أحد المستخدمين الانضمام إلى قائمتك')
  );
END;
$$;


ALTER FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mediator')
    THEN RAISE EXCEPTION 'Unauthorized: not a mediator'; END IF;
  IF NOT EXISTS (SELECT 1 FROM mediator_subscriptions WHERE mediator_id = auth.uid() AND id = p_subscriber_id)
    THEN RAISE EXCEPTION 'Unauthorized: not your subscriber'; END IF;
  UPDATE profiles SET verification_status = p_status, updated_at = now() WHERE id = p_subscriber_id;
END;
$$;


ALTER FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."smart_deduct_points"("action_type" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    target_user_id UUID := auth.uid();
    action_cost INTEGER;
    user_wal public.wallets%ROWTYPE;
BEGIN
    -- تحديد التكلفة
    action_cost := CASE 
        WHEN action_type = 'swipe_back' THEN 3
        WHEN action_type = 'like' THEN 7
        WHEN action_type = 'message' THEN 20
        ELSE 0
    END;

    -- جلب سجل المحفظة مع قفل للتحديث لضمان دقة الرصيد (Row Level Locking)
    SELECT * INTO user_wal FROM public.wallets WHERE id = target_user_id FOR UPDATE;

    -- التحقق من إجمالي الرصيد (المجاني + الأساسي)
    IF (user_wal.balance + user_wal.balance_free) < action_cost THEN
        RETURN json_build_object('success', false, 'error', 'insufficient_balance');
    END IF;

    -- الخصم من الرصيد المجاني أولاً ثم الأساسي
    IF user_wal.balance_free >= action_cost THEN
        UPDATE public.wallets SET balance_free = balance_free - action_cost WHERE id = target_user_id;
    ELSE
        UPDATE public.wallets 
        SET balance = balance - (action_cost - balance_free), 
            balance_free = 0 
        WHERE id = target_user_id;
    END IF;

    -- تسجيل العملية في جدول المعاملات (transaction_id يُنشأ تلقائياً حسب جدولك)
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (target_user_id, action_cost, 'out', action_type);

    RETURN json_build_object('success', true, 'remaining_total', 
        (SELECT balance + balance_free FROM public.wallets WHERE id = target_user_id));
END;
$$;


ALTER FUNCTION "public"."smart_deduct_points"("action_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- يحاول الخصم من المكافآت أولاً، إذا لم تكفِ يخصم من الحقيقي
    -- (يمكنك تعديل هذا المنطق ليخصم من المكافآت فقط حسب رغبتك)
    UPDATE wallets 
    SET bonus_balance = bonus_balance - points_amount
    WHERE user_id = user_uid AND bonus_balance >= points_amount;

    IF NOT FOUND THEN
        -- إذا لم يتوفر رصيد مكافآت، نخصم من الحقيقي كخيار بديل
        UPDATE wallets 
        SET paid_balance = paid_balance - points_amount
        WHERE user_id = user_uid AND paid_balance >= points_amount;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'رصيدك الإجمالي غير كافٍ.';
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_points"("points_to_spend" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (SELECT (balance_free + balance_paid) FROM public.wallets WHERE id = auth.uid()) < points_to_spend THEN
        RAISE EXCEPTION 'رصيدك غير كافٍ';
    END IF;
    
    -- المنطق: اخصم من المجاني أولاً
    UPDATE public.wallets 
    SET balance_free = CASE 
            WHEN balance_free >= points_to_spend THEN balance_free - points_to_spend 
            ELSE 0 END,
        balance_paid = CASE 
            WHEN balance_free < points_to_spend THEN balance_paid - (points_to_spend - balance_free)
            ELSE balance_paid END
    WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."spend_points"("points_to_spend" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_paid INTEGER;
    current_bonus INTEGER;
BEGIN
    -- 1. جلب الأرصدة الحالية
    SELECT paid_balance, bonus_balance INTO current_paid, current_bonus
    FROM wallets WHERE user_id = user_uid;

    -- 2. التحقق من القواعد حسب نوع الواجهة
    IF is_mediator_view THEN
        -- في واجهة الوسيط: الخصم من الرصيد الحقيقي فقط
        IF current_paid < amount THEN
            RAISE EXCEPTION 'رصيدك الحقيقي غير كافٍ لهذه العملية';
        END IF;
        
        UPDATE wallets 
        SET paid_balance = paid_balance - amount, updated_at = NOW()
        WHERE user_id = user_uid;
    ELSE
        -- في الواجهة العامة: الخصم من المكافآت أولاً، ثم الحقيقي
        IF (current_bonus + current_paid) < amount THEN
            RAISE EXCEPTION 'رصيدك الإجمالي غير كافٍ';
        END IF;

        IF current_bonus >= amount THEN
            UPDATE wallets SET bonus_balance = bonus_balance - amount WHERE user_id = user_uid;
        ELSE
            UPDATE wallets 
            SET bonus_balance = 0, 
                paid_balance = paid_balance - (amount - current_bonus)
            WHERE user_id = user_uid;
        END IF;
    END IF;

    -- 3. تسجيل العملية في جدول التاريخ
    INSERT INTO point_transactions (wallet_id, amount, balance_type, transaction_type, description)
    VALUES (
        (SELECT id FROM wallets WHERE user_id = user_uid),
        -amount,
        CASE WHEN is_mediator_view THEN 'paid' ELSE 'bonus' END,
        'swipe_card',
        CASE WHEN is_mediator_view THEN 'سحب بطاقة (واجهة وسيط)' ELSE 'سحب بطاقة (واجهة عامة)' END
    );
END;
$$;


ALTER FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_points_smart"("action_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    u_id UUID := auth.uid();
    action_cost INTEGER;
    wallet_record RECORD;
BEGIN
    -- تعريف قائمة الأسعار
    action_cost := CASE 
        WHEN action_name = 'undo_swipe' THEN 3
        WHEN action_name = 'like_action' THEN 7
        WHEN action_name = 'premium_chat' THEN 20
        ELSE 0
    END;

    -- قفل السجل لضمان عدم حدوث تلاعب (Race Condition)
    SELECT balance, balance_free INTO wallet_record FROM public.wallets WHERE id = u_id FOR UPDATE;

    -- التحقق من الرصيد الإجمالي
    IF (wallet_record.balance + wallet_record.balance_free) < action_cost THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient points');
    END IF;

    -- منطق الخصم: المجاني أولاً
    IF wallet_record.balance_free >= action_cost THEN
        UPDATE public.wallets SET balance_free = balance_free - action_cost WHERE id = u_id;
    ELSE
        UPDATE public.wallets 
        SET balance = balance - (action_cost - wallet_record.balance_free), 
            balance_free = 0 
        WHERE id = u_id;
    END IF;

    -- تسجيل الحركة في جدول point_transactions المكتمل في ملفك
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (u_id, action_cost, 'withdrawal', action_name);

    RETURN json_build_object('success', true, 'new_total', (SELECT balance + balance_free FROM public.wallets WHERE id = u_id));
END;
$$;


ALTER FUNCTION "public"."spend_points_smart"("action_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."spend_user_points"("cost" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF (SELECT balance FROM public.wallets WHERE id = auth.uid()) < cost THEN
        RAISE EXCEPTION 'رصيدك غير كافٍ، يرجى شحن نقاطك';
    END IF;

    UPDATE public.wallets 
    SET balance = balance - cost 
    WHERE id = auth.uid();
    
    -- تسجيل العملية في جدول point_transactions
    INSERT INTO public.point_transactions (id, amount, transaction_type, reason)
    VALUES (auth.uid(), cost, 'subtract', 'operation_cost');
END;
$$;


ALTER FUNCTION "public"."spend_user_points"("cost" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_coords"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.coords = ST_SetSRID(
      ST_MakePoint(NEW.longitude, NEW.latitude),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_coords"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_wallet_name"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    UPDATE wallets
      SET user_name = NEW.full_name
      WHERE id = NEW.id;

    UPDATE mediator_wallets
      SET user_name = NEW.full_name
      WHERE mediator_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_wallet_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_zawaj_tables"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- 1. تحديث أو إضافة سجل في جدول المحفظة (Wallets)
  -- نستخدم bonus_balance بدلاً من balance كما يظهر في ملفك
  INSERT INTO wallets (user_id, bonus_balance, updated_at)
  VALUES (NEW.id, COALESCE(NEW.success_count, 0), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET bonus_balance = EXCLUDED.bonus_balance, updated_at = NOW();

  -- 2. تحديث رتبة الوسيط (mediator_level) تلقائياً
  IF (NEW.role = 'mediator' OR NEW.role = 'broker') THEN
    NEW.mediator_level := 
      CASE 
        WHEN NEW.success_count >= 100 THEN 'Diamond'
        WHEN NEW.success_count >= 50 THEN 'Gold'
        ELSE 'Silver'
      END;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_zawaj_tables"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_send_push_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'record', jsonb_build_object(
      'notification_id', NEW.notification_id,
      'to_user',         NEW.id,
      'from_user',       NEW.from_user,
      'type',            NEW.type,
      'title',           NEW.title,
      'message',         NEW.message,
      'conversation_id', NEW.conversation_id,
      'is_read',         NEW.is_read,
      'created_at',      NEW.created_at
    )
  );

  PERFORM net.http_post(
    url     := 'https://lbftmbutvtjtkxgdbndu.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiZnRtYnV0dnRqdGt4Z2RibmR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE5MzcxMywiZXhwIjoyMDg2NzY5NzEzfQ.AYy0hwM5ksBLBoEx-S8r7WcVBXDkI3Z9Lpnw2UTVJ2U'
    ),
    body    := payload
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_send_push_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_on_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message = NEW.content,
    last_message_time = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_on_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text" DEFAULT NULL::"text", "p_country" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  UPDATE profiles
  SET
    latitude   = p_lat,
    longitude  = p_lon,
    -- ✅ التحويل الصحيح: ST_MakePoint(lon, lat) ثم تحويله لـ geography
    coords     = ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
    city       = COALESCE(p_city, city),
    country    = COALESCE(p_country, country),
    updated_at = now()
  WHERE id = p_user_id;
$$;


ALTER FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text", "p_country" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."account_deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "ip_address" "text",
    CONSTRAINT "account_deletion_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."account_deletion_requests" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."accounts_pending_deletion" WITH ("security_invoker"='true') AS
 SELECT "id",
    "full_name",
    "account_status",
    "last_active_at",
    "created_at",
    ("now"() - "last_active_at") AS "inactive_since",
    ("last_active_at" + '2 mons'::interval) AS "will_be_deleted_at"
   FROM "public"."profiles"
  WHERE (("last_active_at" < ("now"() - '1 mon 15 days'::interval)) AND ("role" <> ALL (ARRAY['admin'::"text", 'moderator'::"text"])) AND ("account_status" <> 'deleted'::"text") AND ("created_at" < ("now"() - '2 mons'::interval)))
  ORDER BY "last_active_at";


ALTER VIEW "public"."accounts_pending_deletion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_categories" (
    "app_id" "uuid",
    "category_id" "uuid"
);


ALTER TABLE "public"."app_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "app_id" "uuid",
    "image_url" "text" NOT NULL,
    "order_index" integer DEFAULT 0
);


ALTER TABLE "public"."app_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_meta" (
    "app_id" "uuid" NOT NULL,
    "size" "text",
    "developer" "text",
    "last_update" timestamp without time zone,
    "downloads" integer DEFAULT 0
);


ALTER TABLE "public"."app_meta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon_url" "text" NOT NULL,
    "short_description" "text",
    "full_description" "text",
    "version" "text",
    "price_type" "text" DEFAULT 'free'::"text",
    "price_value" numeric DEFAULT 0,
    "currency" "text",
    "is_published" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0,
    "publish" boolean,
    CONSTRAINT "apps_currency_check" CHECK (("currency" = ANY (ARRAY['TND'::"text", 'USD'::"text", 'EUR'::"text"]))),
    CONSTRAINT "apps_price_type_check" CHECK (("price_type" = ANY (ARRAY['free'::"text", 'paid'::"text", 'credits'::"text"])))
);


ALTER TABLE "public"."apps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_handshakes" (
    "code" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:01:30'::interval) NOT NULL,
    "used" boolean DEFAULT false NOT NULL,
    "access_token" "text",
    "refresh_token" "text"
);


ALTER TABLE "public"."auth_handshakes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."blocks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" "text" NOT NULL,
    "decision" "text" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_moderation_logs_content_type_check" CHECK (("content_type" = ANY (ARRAY['text'::"text", 'image'::"text"]))),
    CONSTRAINT "content_moderation_logs_decision_check" CHECK (("decision" = ANY (ARRAY['approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."content_moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_1" "uuid" NOT NULL,
    "user_2" "uuid" NOT NULL,
    "last_message" "text" DEFAULT ''::"text",
    "last_message_time" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "first_message_accepted" boolean DEFAULT false NOT NULL,
    "is_unlocked" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."economy_config" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."economy_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fcm_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "device_type" "text",
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "platform" "text" DEFAULT 'android'::"text" NOT NULL,
    "app_version" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "last_opened_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "channel_messages" "text" DEFAULT 'on'::"text" NOT NULL,
    "channel_social" "text" DEFAULT 'on'::"text" NOT NULL,
    "channel_mediator" "text" DEFAULT 'on'::"text" NOT NULL,
    "channel_subscription" "text" DEFAULT 'on'::"text" NOT NULL,
    "channel_system" "text" DEFAULT 'on'::"text" NOT NULL
);


ALTER TABLE "public"."fcm_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."fcm_tokens" IS 'FCM device tokens — يدعم تعدد الأجهزة والقنوات وتفضيلات المستخدم';



COMMENT ON COLUMN "public"."fcm_tokens"."platform" IS 'android | ios | web';



COMMENT ON COLUMN "public"."fcm_tokens"."is_active" IS 'false عند انتهاء صلاحية التوكن أو حذف التطبيق';



COMMENT ON COLUMN "public"."fcm_tokens"."channel_messages" IS 'on | silent | off';



COMMENT ON COLUMN "public"."fcm_tokens"."channel_social" IS 'on | silent | off — إعجابات، زيارات، توافق';



COMMENT ON COLUMN "public"."fcm_tokens"."channel_mediator" IS 'on | silent | off — إشعارات الوسيط';



COMMENT ON COLUMN "public"."fcm_tokens"."channel_subscription" IS 'on | silent | off — الاشتراكات';



COMMENT ON COLUMN "public"."fcm_tokens"."channel_system" IS 'on | silent | off — إشعارات النظام';



CREATE TABLE IF NOT EXISTS "public"."feature_details" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."feature_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_details_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "detail_id" "uuid",
    "lang" "text" NOT NULL,
    "content" "text" NOT NULL,
    CONSTRAINT "feature_details_translations_lang_check" CHECK (("lang" = ANY (ARRAY['en'::"text", 'fr'::"text", 'ar'::"text"])))
);


ALTER TABLE "public"."feature_details_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "lang" "text" NOT NULL,
    "title" "text" NOT NULL,
    CONSTRAINT "feature_translations_lang_check" CHECK (("lang" = ANY (ARRAY['en'::"text", 'fr'::"text", 'ar'::"text"])))
);


ALTER TABLE "public"."feature_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid",
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gift_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_id" "uuid",
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "source" "text" DEFAULT 'action'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gift_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interests_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."interests_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."konnect_payments" (
    "payment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_id" "text" NOT NULL,
    "coins_amount" integer NOT NULL,
    "currency" "text" NOT NULL,
    "display_amount" numeric(10,3) NOT NULL,
    "tnd_amount" numeric(10,3) NOT NULL,
    "konnect_ref" "text",
    "konnect_pay_url" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "webhook_payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:30:00'::interval) NOT NULL,
    "payment_method" "text" DEFAULT 'konnect'::"text" NOT NULL,
    "provider_transaction_id" "text",
    CONSTRAINT "konnect_payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['konnect'::"text", 'google_play'::"text"]))),
    CONSTRAINT "konnect_payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."konnect_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_user" "uuid",
    "to_user" "uuid",
    "action" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_match" boolean DEFAULT false,
    CONSTRAINT "likes_action_check" CHECK (("action" = ANY (ARRAY['like'::"text", 'pass'::"text", 'view'::"text", 'block'::"text", 'message'::"text"])))
);


ALTER TABLE "public"."likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mediator_id" "uuid" NOT NULL,
    "coins" integer NOT NULL,
    "tnd_value" numeric NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."mediator_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mediator_id" "uuid",
    "period" "text",
    "total_points" integer,
    "total_tnd" numeric,
    "total_usd" numeric,
    "total_eur" numeric,
    "payout_tnd" numeric,
    "payout_usd" numeric,
    "payout_eur" numeric,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."mediator_earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_notes" (
    "note_internal_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mediator_id" "uuid",
    "id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mediator_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_pricing" (
    "mediator_id" "uuid" NOT NULL,
    "tier_1_coins" integer DEFAULT 2000 NOT NULL,
    "tier_1_label" "text" DEFAULT 'أساسية'::"text" NOT NULL,
    "tier_1_desc" "text" DEFAULT 'دخول قائمة المشتركين والتواصل مع الوسيط'::"text" NOT NULL,
    "tier_1_perks" "text"[] DEFAULT ARRAY['ظهور في قائمة المشتركين'::"text", 'تواصل مع الوسيط'::"text", 'صالحة 30 يوم'::"text"] NOT NULL,
    "tier_2_coins" integer DEFAULT 5000 NOT NULL,
    "tier_2_label" "text" DEFAULT 'مميزة'::"text" NOT NULL,
    "tier_2_desc" "text" DEFAULT 'أولوية في المطابقة واهتمام شخصي من الوسيط'::"text" NOT NULL,
    "tier_2_perks" "text"[] DEFAULT ARRAY['كل مزايا الأساسية'::"text", 'أولوية في المطابقة'::"text", 'اهتمام شخصي'::"text", 'صالحة 30 يوم'::"text"] NOT NULL,
    "popular_tier" smallint DEFAULT 2 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mediator_pricing_popular_tier_check" CHECK (("popular_tier" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "mediator_pricing_tier_1_coins_check" CHECK ((("tier_1_coins" >= 1000) AND ("tier_1_coins" <= 10000))),
    CONSTRAINT "mediator_pricing_tier_2_coins_check" CHECK ((("tier_2_coins" >= 1000) AND ("tier_2_coins" <= 10000)))
);


ALTER TABLE "public"."mediator_pricing" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_reviews" (
    "review_internal_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "mediator_id" "uuid",
    "id" "uuid",
    "rating" integer,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mediator_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."mediator_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_subscriber_info" (
    "mediator_id" "uuid" NOT NULL,
    "subscriber_id" "uuid" NOT NULL,
    "subscriber_wa" "text",
    "subscriber_fb" "text",
    "subscriber_ig" "text",
    "subscriber_tt" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mediator_subscriber_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mediator_subscriptions" (
    "med_sub_internal_id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "id" "uuid",
    "mediator_id" "uuid",
    "tier" "text",
    "remaining_likes" integer,
    "last_free_consultation" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "mediator_subscriptions_tier_check" CHECK (("tier" = ANY (ARRAY['silver'::"text", 'gold'::"text"])))
);


ALTER TABLE "public"."mediator_subscriptions" OWNER TO "postgres";


COMMENT ON TABLE "public"."mediator_subscriptions" IS 'Mediator Subscriptions Table';



CREATE TABLE IF NOT EXISTS "public"."mediator_wallets" (
    "mediator_id" "uuid" NOT NULL,
    "total_coins" integer DEFAULT 0,
    "total_tnd" numeric DEFAULT 0,
    "pending_tnd" numeric DEFAULT 0,
    "paid_tnd" numeric DEFAULT 0,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "user_name" "text",
    "total_subscribers" integer DEFAULT 0,
    "current_level" "text" DEFAULT 'Level 1'::"text" NOT NULL,
    "total_subscription_events" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."mediator_wallets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."mediators_view" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "full_name",
    NULL::"text" AS "avatar_url",
    NULL::"text" AS "bio",
    NULL::"text" AS "city",
    NULL::"text" AS "country",
    NULL::integer AS "success_count",
    NULL::"text" AS "mediator_level",
    NULL::numeric(3,1) AS "avg_rating",
    NULL::bigint AS "rating_count",
    NULL::bigint AS "male_count",
    NULL::bigint AS "female_count";


ALTER VIEW "public"."mediators_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "message_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "audio_url" "text",
    "listened_at" timestamp with time zone,
    "reply_to_id" "uuid",
    "reply_to_content" "text",
    "reply_to_type" "text",
    CONSTRAINT "messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'voice'::"text"])))
);

ALTER TABLE ONLY "public"."messages" REPLICA IDENTITY FULL;


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "notification_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id" "uuid" NOT NULL,
    "title" "text",
    "message" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "text",
    "from_user" "uuid",
    "conversation_id" "uuid",
    "to_user" "uuid"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Notifications Table';



CREATE TABLE IF NOT EXISTS "public"."offer_feature_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature_id" "uuid",
    "lang" "text" NOT NULL,
    "title" "text",
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offer_feature_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid",
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offer_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid",
    "key" "text",
    "value" "text"
);


ALTER TABLE "public"."offer_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offer_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "offer_id" "uuid",
    "lang" "text" NOT NULL,
    "title_h1" "text",
    "title_h2" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offer_translations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "image_url" "text",
    "price_tnd" numeric,
    "price_usd" numeric,
    "price_eur" numeric,
    "discount_percent" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_usages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "used_coins" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_usages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payouts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mediator_id" "uuid",
    "amount" numeric,
    "currency" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp without time zone,
    "period" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "notes" "text",
    "admin_note" "text",
    "iban" "text",
    "rejected_at" timestamp with time zone
);


ALTER TABLE "public"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transactions" (
    "transaction_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "source" "text" NOT NULL,
    "action" "text",
    "payment_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mediator_id" "uuid",
    "value_tnd" numeric,
    "value_usd" numeric,
    "value_eur" numeric,
    "currency" "text",
    "country" "text",
    "user_name" "text",
    "user_avatar" "text",
    CONSTRAINT "point_transactions_source_check" CHECK (("source" = ANY (ARRAY['konnect'::"text", 'subscription'::"text", 'mediator_income'::"text", 'payout'::"text", 'daily_bonus'::"text", 'admin'::"text", 'referral'::"text", 'welcome'::"text"])))
);


ALTER TABLE "public"."point_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_profiles" WITH ("security_invoker"='false') AS
 SELECT "id",
    "full_name",
    "gender",
    "age",
    "country",
    "city",
    "avatar_url",
    "bio",
    "interests",
    "marital_status",
    "education_level",
    "height",
    "religious_commitment",
    "is_photos_blurred",
    "show_photos",
    "verification_status",
    "last_active_at"
   FROM "public"."profiles"
  WHERE (("account_status" IS DISTINCT FROM 'disabled'::"text") AND ("deleted_at" IS NULL));


ALTER VIEW "public"."public_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchased_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "payment_id" "uuid",
    "coins_total" integer,
    "coins_remaining" integer,
    "tnd_total" numeric,
    "tnd_per_coin" numeric,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."purchased_points" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_education_level" (
    "id" integer NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."ref_education_level" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_housing_type" (
    "id" integer NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."ref_housing_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_marital_status" (
    "id" integer NOT NULL,
    "label_m" "text" NOT NULL,
    "label_f" "text" NOT NULL
);


ALTER TABLE "public"."ref_marital_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_occupation_categories" (
    "id" integer NOT NULL,
    "label" "text" NOT NULL
);


ALTER TABLE "public"."ref_occupation_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ref_religious_commitment" (
    "id" integer NOT NULL,
    "label_m" "text" NOT NULL,
    "label_f" "text" NOT NULL
);


ALTER TABLE "public"."ref_religious_commitment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "uploader_id" "uuid"
);


ALTER TABLE "public"."report_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "reported_id" "uuid",
    "reason" "text",
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "target_type" "text" DEFAULT 'profile'::"text",
    "target_id" "uuid",
    "priority" "text" DEFAULT 'normal'::"text",
    "auto_action_taken" boolean DEFAULT false,
    "moderator_notes" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "updates_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reports_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'investigating'::"text", 'resolved'::"text", 'rejected'::"text", 'warning_sent'::"text", 'banned'::"text"]))),
    CONSTRAINT "reports_target_type_check" CHECK (("target_type" = ANY (ARRAY['profile'::"text", 'message'::"text", 'image'::"text", 'voice'::"text", 'call'::"text", 'story'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "app_name" "text" DEFAULT 'ZAWAJ AI'::"text",
    "app_slogan" "text" DEFAULT 'مستقبل الزواج الذكي'::"text",
    "logo_url" "text" DEFAULT ''::"text",
    "primary_color" "text" DEFAULT '#800020'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" NOT NULL,
    "mediator_id" "uuid",
    "tier" "text",
    "amount" numeric(10,2),
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tier_type" "text",
    "features_snapshot" "jsonb",
    CONSTRAINT "chk_tier_type_valid" CHECK (("tier_type" = ANY (ARRAY['free'::"text", 'silver'::"text", 'gold'::"text", 'platinum'::"text", 'diamond'::"text"]))),
    CONSTRAINT "subscriptions_tier_check" CHECK (("tier" = ANY (ARRAY['silver'::"text", 'gold'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" NOT NULL,
    "balance" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "balance_free" integer DEFAULT 100,
    "last_daily_login" "date" DEFAULT CURRENT_DATE,
    "last_active_at" timestamp with time zone DEFAULT "now"(),
    "badge_type" "text" DEFAULT 'none'::"text",
    "badge_expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "user_name" "text"
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."wallets_view" WITH ("security_invoker"='true') AS
 SELECT "w"."id",
    "p"."full_name",
    "p"."gender",
    "p"."avatar_url",
    "p"."country",
    "p"."city",
    "w"."balance",
    "w"."balance_free",
    ("w"."balance" + "w"."balance_free") AS "total_balance",
    "w"."badge_type",
    "w"."badge_expires_at",
    "w"."last_daily_login",
    "w"."created_at",
        CASE
            WHEN ("w"."badge_type" = 'none'::"text") THEN false
            WHEN ("w"."badge_expires_at" IS NULL) THEN true
            WHEN ("w"."badge_expires_at" > "now"()) THEN true
            ELSE false
        END AS "badge_active"
   FROM ("public"."wallets" "w"
     JOIN "public"."profiles" "p" ON (("p"."id" = "w"."id")));


ALTER VIEW "public"."wallets_view" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_deletion_requests"
    ADD CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_images"
    ADD CONSTRAINT "app_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_meta"
    ADD CONSTRAINT "app_meta_pkey" PRIMARY KEY ("app_id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apps"
    ADD CONSTRAINT "apps_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."auth_handshakes"
    ADD CONSTRAINT "auth_handshakes_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_unique" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_moderation_logs"
    ADD CONSTRAINT "content_moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_1_user_2_key" UNIQUE ("user_1", "user_2");



ALTER TABLE ONLY "public"."economy_config"
    ADD CONSTRAINT "economy_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."feature_details"
    ADD CONSTRAINT "feature_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_details_translations"
    ADD CONSTRAINT "feature_details_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_translations"
    ADD CONSTRAINT "feature_translations_feature_id_lang_key" UNIQUE ("feature_id", "lang");



ALTER TABLE ONLY "public"."feature_translations"
    ADD CONSTRAINT "feature_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gift_transactions"
    ADD CONSTRAINT "gift_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interests_options"
    ADD CONSTRAINT "interests_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."konnect_payments"
    ADD CONSTRAINT "konnect_payments_konnect_ref_key" UNIQUE ("konnect_ref");



ALTER TABLE ONLY "public"."konnect_payments"
    ADD CONSTRAINT "konnect_payments_pkey" PRIMARY KEY ("payment_id");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_from_to_action_unique" UNIQUE ("from_user", "to_user", "action");



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mediator_clients"
    ADD CONSTRAINT "mediator_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mediator_earnings"
    ADD CONSTRAINT "mediator_earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mediator_notes"
    ADD CONSTRAINT "mediator_notes_pair_unique" UNIQUE ("mediator_id", "id");



ALTER TABLE ONLY "public"."mediator_notes"
    ADD CONSTRAINT "mediator_notes_pkey" PRIMARY KEY ("note_internal_id");



ALTER TABLE ONLY "public"."mediator_pricing"
    ADD CONSTRAINT "mediator_pricing_pkey" PRIMARY KEY ("mediator_id");



ALTER TABLE ONLY "public"."mediator_reviews"
    ADD CONSTRAINT "mediator_reviews_mediator_id_reviewer_id_key" UNIQUE ("mediator_id", "id");



ALTER TABLE ONLY "public"."mediator_reviews"
    ADD CONSTRAINT "mediator_reviews_pkey" PRIMARY KEY ("review_internal_id");



ALTER TABLE ONLY "public"."mediator_subscriptions"
    ADD CONSTRAINT "mediator_subs_user_mediator_unique" UNIQUE ("id", "mediator_id");



ALTER TABLE ONLY "public"."mediator_subscriber_info"
    ADD CONSTRAINT "mediator_subscriber_info_pkey" PRIMARY KEY ("mediator_id", "subscriber_id");



ALTER TABLE ONLY "public"."mediator_subscriptions"
    ADD CONSTRAINT "mediator_subscriptions_pkey" PRIMARY KEY ("med_sub_internal_id");



ALTER TABLE ONLY "public"."mediator_wallets"
    ADD CONSTRAINT "mediator_wallets_pkey" PRIMARY KEY ("mediator_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."offer_feature_translations"
    ADD CONSTRAINT "offer_feature_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_features"
    ADD CONSTRAINT "offer_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_limits"
    ADD CONSTRAINT "offer_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offer_translations"
    ADD CONSTRAINT "offer_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."payment_usages"
    ADD CONSTRAINT "payment_usages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("transaction_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchased_points"
    ADD CONSTRAINT "purchased_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_education_level"
    ADD CONSTRAINT "ref_education_level_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_housing_type"
    ADD CONSTRAINT "ref_housing_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_marital_status"
    ADD CONSTRAINT "ref_marital_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_occupation_categories"
    ADD CONSTRAINT "ref_occupation_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ref_religious_commitment"
    ADD CONSTRAINT "ref_religious_commitment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_attachments"
    ADD CONSTRAINT "report_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



CREATE INDEX "blocks_blocked_idx" ON "public"."blocks" USING "btree" ("blocked_id");



CREATE INDEX "blocks_blocker_idx" ON "public"."blocks" USING "btree" ("blocker_id");



CREATE INDEX "gift_tx_action_idx" ON "public"."gift_transactions" USING "btree" ("action");



CREATE INDEX "gift_tx_created_at_idx" ON "public"."gift_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "gift_tx_user_id_idx" ON "public"."gift_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_blocks_blocked" ON "public"."blocks" USING "btree" ("blocked_id");



CREATE INDEX "idx_blocks_blocker" ON "public"."blocks" USING "btree" ("blocker_id");



CREATE INDEX "idx_conversations_unlocked" ON "public"."conversations" USING "btree" ("is_unlocked");



CREATE INDEX "idx_conversations_user_1" ON "public"."conversations" USING "btree" ("user_1");



CREATE INDEX "idx_conversations_user_2" ON "public"."conversations" USING "btree" ("user_2");



CREATE INDEX "idx_fcm_tokens_user_active" ON "public"."fcm_tokens" USING "btree" ("user_id", "is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_fcm_tokens_user_id" ON "public"."fcm_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_feature_details_feature" ON "public"."feature_details" USING "btree" ("feature_id");



CREATE INDEX "idx_features_offer" ON "public"."features" USING "btree" ("offer_id");



CREATE INDEX "idx_kp_expires_at" ON "public"."konnect_payments" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_kp_konnect_ref" ON "public"."konnect_payments" USING "btree" ("konnect_ref");



CREATE INDEX "idx_kp_status" ON "public"."konnect_payments" USING "btree" ("status");



CREATE INDEX "idx_kp_user_id" ON "public"."konnect_payments" USING "btree" ("user_id");



CREATE INDEX "idx_likes_created_at" ON "public"."likes" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_likes_from" ON "public"."likes" USING "btree" ("from_user", "action");



CREATE INDEX "idx_likes_from_action_created" ON "public"."likes" USING "btree" ("from_user", "action", "created_at" DESC);



CREATE INDEX "idx_likes_from_user" ON "public"."likes" USING "btree" ("from_user", "created_at" DESC);



CREATE INDEX "idx_likes_is_match" ON "public"."likes" USING "btree" ("is_match") WHERE ("is_match" = true);



CREATE INDEX "idx_likes_reciprocal" ON "public"."likes" USING "btree" ("to_user", "from_user", "is_match");



CREATE INDEX "idx_likes_to" ON "public"."likes" USING "btree" ("to_user", "action");



CREATE INDEX "idx_likes_to_user" ON "public"."likes" USING "btree" ("to_user", "action");



CREATE INDEX "idx_messages_conv" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_type" ON "public"."messages" USING "btree" ("message_type");



CREATE INDEX "idx_mod_logs_decision" ON "public"."content_moderation_logs" USING "btree" ("decision");



CREATE INDEX "idx_mod_logs_user" ON "public"."content_moderation_logs" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("id", "is_read", "created_at" DESC);



CREATE INDEX "idx_profiles_account_status" ON "public"."profiles" USING "btree" ("account_status");



CREATE INDEX "idx_profiles_discovery" ON "public"."profiles" USING "btree" ("gender", "is_completed", "age", "country", "city");



CREATE INDEX "idx_profiles_gender_age" ON "public"."profiles" USING "btree" ("gender", "age");



CREATE INDEX "idx_profiles_location" ON "public"."profiles" USING "btree" ("country", "city");



CREATE INDEX "idx_profiles_matching" ON "public"."profiles" USING "btree" ("gender", "age", "country", "city", "is_completed") WHERE ("is_completed" = true);



CREATE INDEX "idx_profiles_occupation" ON "public"."profiles" USING "btree" ("occupation_category_id", "occupation_id");



CREATE INDEX "idx_profiles_religious" ON "public"."profiles" USING "btree" ("religious_commitment");



CREATE INDEX "idx_pt_created_at" ON "public"."point_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pt_source" ON "public"."point_transactions" USING "btree" ("source");



CREATE INDEX "idx_pt_user_id" ON "public"."point_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_wallets_badge" ON "public"."wallets" USING "btree" ("badge_type") WHERE ("badge_type" <> 'none'::"text");



CREATE UNIQUE INDEX "konnect_payments_provider_tx_uidx" ON "public"."konnect_payments" USING "btree" ("provider_transaction_id") WHERE ("provider_transaction_id" IS NOT NULL);



CREATE INDEX "notifications_conversation_idx" ON "public"."notifications" USING "btree" ("conversation_id");



CREATE INDEX "notifications_to_user_idx" ON "public"."notifications" USING "btree" ("to_user");



CREATE INDEX "reports_created_at_idx" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "reports_reported_idx" ON "public"."reports" USING "btree" ("reported_id");



CREATE INDEX "reports_reporter_idx" ON "public"."reports" USING "btree" ("reporter_id");



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status");



CREATE UNIQUE INDEX "unique_active_report" ON "public"."reports" USING "btree" ("reporter_id", "reported_id", "target_type", "target_id") WHERE ("status" = ANY (ARRAY['pending'::"text", 'investigating'::"text"]));



CREATE UNIQUE INDEX "unique_block_pair" ON "public"."blocks" USING "btree" ("blocker_id", "blocked_id");



CREATE OR REPLACE VIEW "public"."mediators_view" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."full_name",
    "p"."avatar_url",
    "p"."bio",
    "p"."city",
    "p"."country",
    "p"."success_count",
    "p"."mediator_level",
    (COALESCE("avg"("r"."rating"), (0)::numeric))::numeric(3,1) AS "avg_rating",
    "count"(DISTINCT "r"."review_internal_id") AS "rating_count",
    "count"(DISTINCT
        CASE
            WHEN ("sub"."gender" = 'male'::"text") THEN "sub"."id"
            ELSE NULL::"uuid"
        END) AS "male_count",
    "count"(DISTINCT
        CASE
            WHEN ("sub"."gender" = 'female'::"text") THEN "sub"."id"
            ELSE NULL::"uuid"
        END) AS "female_count"
   FROM (("public"."profiles" "p"
     LEFT JOIN "public"."mediator_reviews" "r" ON (("r"."mediator_id" = "p"."id")))
     LEFT JOIN "public"."profiles" "sub" ON (("sub"."mediator_id" = "p"."id")))
  WHERE ("p"."role" = 'mediator'::"text")
  GROUP BY "p"."id";



CREATE OR REPLACE TRIGGER "after_message_for_notification" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."create_notification_on_new_message"();



CREATE OR REPLACE TRIGGER "after_message_inserted" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_conversation_on_new_message"();



CREATE OR REPLACE TRIGGER "on_like_insert" AFTER INSERT ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."notify_on_like"();



CREATE OR REPLACE TRIGGER "protect_profile_sensitive_columns_trg" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_sensitive_columns"();



CREATE OR REPLACE TRIGGER "send_push_notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_send_push_notification"();



CREATE OR REPLACE TRIGGER "tr_match_check" AFTER INSERT ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."check_match_on_like"();



CREATE OR REPLACE TRIGGER "trg_create_mediator_pricing" AFTER UPDATE OF "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_mediator_pricing"();



CREATE OR REPLACE TRIGGER "trg_create_wallet_on_profile" AFTER INSERT OR UPDATE OF "full_name", "role" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_wallet_on_profile"();



CREATE OR REPLACE TRIGGER "trg_new_subscription" AFTER INSERT ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_subscription"();



CREATE OR REPLACE TRIGGER "trg_payment_completed" AFTER UPDATE OF "status" ON "public"."konnect_payments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_payment_completed"();



CREATE OR REPLACE TRIGGER "trg_payout_approved" BEFORE UPDATE OF "status" ON "public"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_payout_approved"();



CREATE OR REPLACE TRIGGER "trg_sync_wallet_name" AFTER UPDATE OF "full_name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_wallet_name"();



CREATE OR REPLACE TRIGGER "trigger_check_match" AFTER INSERT ON "public"."likes" FOR EACH ROW EXECUTE FUNCTION "public"."check_for_match"();



ALTER TABLE ONLY "public"."app_categories"
    ADD CONSTRAINT "app_categories_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_categories"
    ADD CONSTRAINT "app_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_images"
    ADD CONSTRAINT "app_images_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_meta"
    ADD CONSTRAINT "app_meta_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "public"."apps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auth_handshakes"
    ADD CONSTRAINT "auth_handshakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_moderation_logs"
    ADD CONSTRAINT "content_moderation_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_1_fkey" FOREIGN KEY ("user_1") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_2_fkey" FOREIGN KEY ("user_2") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fcm_tokens"
    ADD CONSTRAINT "fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_details"
    ADD CONSTRAINT "feature_details_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_details_translations"
    ADD CONSTRAINT "feature_details_translations_detail_id_fkey" FOREIGN KEY ("detail_id") REFERENCES "public"."feature_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_translations"
    ADD CONSTRAINT "feature_translations_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gift_transactions"
    ADD CONSTRAINT "gift_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."konnect_payments"
    ADD CONSTRAINT "konnect_payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_from_user_fk" FOREIGN KEY ("from_user") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_from_user_fkey" FOREIGN KEY ("from_user") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_to_user_fk" FOREIGN KEY ("to_user") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."likes"
    ADD CONSTRAINT "likes_to_user_fkey" FOREIGN KEY ("to_user") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_notes"
    ADD CONSTRAINT "mediator_notes_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_notes"
    ADD CONSTRAINT "mediator_notes_subscriber_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_pricing"
    ADD CONSTRAINT "mediator_pricing_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_reviews"
    ADD CONSTRAINT "mediator_reviews_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mediator_reviews"
    ADD CONSTRAINT "mediator_reviews_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."mediator_reviews"
    ADD CONSTRAINT "mediator_reviews_reviewer_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."mediator_subscriber_info"
    ADD CONSTRAINT "mediator_subscriber_info_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_subscriber_info"
    ADD CONSTRAINT "mediator_subscriber_info_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mediator_subscriptions"
    ADD CONSTRAINT "mediator_subscriptions_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."mediator_subscriptions"
    ADD CONSTRAINT "mediator_subscriptions_user_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_from_user_fkey" FOREIGN KEY ("from_user") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_feature_translations"
    ADD CONSTRAINT "offer_feature_translations_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."offer_features"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_features"
    ADD CONSTRAINT "offer_features_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offer_translations"
    ADD CONSTRAINT "offer_translations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."konnect_payments"("payment_id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."report_attachments"
    ADD CONSTRAINT "report_attachments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_attachments"
    ADD CONSTRAINT "report_attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_mediator_id_fkey" FOREIGN KEY ("mediator_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated insert" ON "public"."auth_handshakes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated insert handshake" ON "public"."auth_handshakes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow authenticated update handshake" ON "public"."auth_handshakes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for users own likes" ON "public"."likes" FOR SELECT USING ((("auth"."uid"() = "from_user") OR ("auth"."uid"() = "to_user")));



CREATE POLICY "Public read apps" ON "public"."apps" FOR SELECT USING (true);



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can insert own report attachments" ON "public"."report_attachments" FOR INSERT WITH CHECK (("auth"."uid"() = "uploader_id"));



CREATE POLICY "Users can insert their own tokens" ON "public"."fcm_tokens" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tokens" ON "public"."fcm_tokens" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own report attachments" ON "public"."report_attachments" FOR SELECT USING (("auth"."uid"() = "uploader_id"));



CREATE POLICY "Users can view own reports" ON "public"."reports" FOR SELECT USING (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can view their own blocks" ON "public"."blocks" FOR SELECT USING (("auth"."uid"() = "blocker_id"));



ALTER TABLE "public"."account_deletion_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "allow authenticated insert fcm" ON "public"."fcm_tokens" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."app_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_meta" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_handshakes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_moderation_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert" ON "public"."conversations" FOR INSERT WITH CHECK ((("user_1" = "auth"."uid"()) OR ("user_2" = "auth"."uid"())));



CREATE POLICY "conversations_select" ON "public"."conversations" FOR SELECT USING ((("user_1" = "auth"."uid"()) OR ("user_2" = "auth"."uid"())));



CREATE POLICY "conversations_update" ON "public"."conversations" FOR UPDATE USING ((("user_1" = "auth"."uid"()) OR ("user_2" = "auth"."uid"())));



ALTER TABLE "public"."economy_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "edge_functions_read" ON "public"."economy_config" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."fcm_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_details_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gift_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_likes" ON "public"."likes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "from_user"));



CREATE POLICY "insert_own_handshake" ON "public"."auth_handshakes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."interests_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."konnect_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "kp_insert_own" ON "public"."konnect_payments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "kp_select_own" ON "public"."konnect_payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "likes_delete_own" ON "public"."likes" FOR DELETE USING (("from_user" = "auth"."uid"()));



ALTER TABLE "public"."mediator_clients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mediator_clients_read" ON "public"."mediator_clients" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("mediator_id" = "auth"."uid"())));



CREATE POLICY "mediator_clients_user_insert" ON "public"."mediator_clients" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "mediator_clients_user_update" ON "public"."mediator_clients" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."mediator_earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mediator_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mediator_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mediator_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mediator_subscriber_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mediator_subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mediator_subscriptions_select_own" ON "public"."mediator_subscriptions" FOR SELECT TO "authenticated" USING ((("mediator_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



ALTER TABLE "public"."mediator_wallets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "mediator_wallets_mediator_read" ON "public"."mediator_wallets" FOR SELECT USING (("mediator_id" = "auth"."uid"()));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete" ON "public"."messages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."user_1" = "auth"."uid"()) OR ("conversations"."user_2" = "auth"."uid"()))))));



CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."user_1" = ( SELECT "auth"."uid"() AS "uid")) OR ("c"."user_2" = ( SELECT "auth"."uid"() AS "uid")))))) AND (NOT (EXISTS ( SELECT 1
   FROM ("public"."blocks" "b"
     JOIN "public"."conversations" "c" ON (("c"."id" = "messages"."conversation_id")))
  WHERE ((("b"."blocker_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("b"."blocked_id" =
        CASE
            WHEN ("c"."user_1" = ( SELECT "auth"."uid"() AS "uid")) THEN "c"."user_2"
            ELSE "c"."user_1"
        END)) OR (("b"."blocked_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("b"."blocker_id" =
        CASE
            WHEN ("c"."user_1" = ( SELECT "auth"."uid"() AS "uid")) THEN "c"."user_2"
            ELSE "c"."user_1"
        END))))))));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."user_1" = "auth"."uid"()) OR ("conversations"."user_2" = "auth"."uid"()))))));



CREATE POLICY "messages_update" ON "public"."messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND (("conversations"."user_1" = "auth"."uid"()) OR ("conversations"."user_2" = "auth"."uid"()))))));



CREATE POLICY "mod_logs_admin_only" ON "public"."content_moderation_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "msi_own" ON "public"."mediator_subscriber_info" USING (("mediator_id" = "auth"."uid"())) WITH CHECK (("mediator_id" = "auth"."uid"()));



CREATE POLICY "no_messages_if_blocked" ON "public"."messages" FOR INSERT WITH CHECK ((NOT (EXISTS ( SELECT 1
   FROM ("public"."blocks" "b"
     JOIN "public"."conversations" "c" ON (("c"."id" = "messages"."conversation_id")))
  WHERE ((("b"."blocker_id" = "auth"."uid"()) AND ("b"."blocked_id" =
        CASE
            WHEN ("c"."user_1" = "auth"."uid"()) THEN "c"."user_2"
            ELSE "c"."user_1"
        END)) OR (("b"."blocked_id" = "auth"."uid"()) AND ("b"."blocker_id" =
        CASE
            WHEN ("c"."user_1" = "auth"."uid"()) THEN "c"."user_2"
            ELSE "c"."user_1"
        END)))))));



CREATE POLICY "notes_own" ON "public"."mediator_notes" USING (("mediator_id" = "auth"."uid"())) WITH CHECK (("mediator_id" = "auth"."uid"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_feature_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offer_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own_handshake" ON "public"."auth_handshakes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "participants_can_select_messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations" "c"
  WHERE (("c"."id" = "messages"."conversation_id") AND (("c"."user_1" = "auth"."uid"()) OR ("c"."user_2" = "auth"."uid"()))))));



ALTER TABLE "public"."payment_usages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payouts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payouts_mediator_insert" ON "public"."payouts" FOR INSERT TO "authenticated" WITH CHECK ((("mediator_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("status" = 'pending'::"text")));



CREATE POLICY "payouts_mediator_read" ON "public"."payouts" FOR SELECT USING (("mediator_id" = "auth"."uid"()));



CREATE POLICY "payouts_mediator_update" ON "public"."payouts" FOR UPDATE USING ((("mediator_id" = "auth"."uid"()) AND ("status" = 'pending'::"text"))) WITH CHECK (("status" = 'pending'::"text"));



ALTER TABLE "public"."point_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_transactions_read" ON "public"."point_transactions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("mediator_id" = "auth"."uid"())));



CREATE POLICY "pricing_insert" ON "public"."mediator_pricing" FOR INSERT WITH CHECK (("mediator_id" = "auth"."uid"()));



CREATE POLICY "pricing_read" ON "public"."mediator_pricing" FOR SELECT USING (true);



CREATE POLICY "pricing_update" ON "public"."mediator_pricing" FOR UPDATE USING (("mediator_id" = "auth"."uid"())) WITH CHECK (("mediator_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_delete_own" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_select_authenticated" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "pt_select_own" ON "public"."point_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "public read offer_feature_translations" ON "public"."offer_feature_translations" FOR SELECT USING (true);



CREATE POLICY "public read offer_features" ON "public"."offer_features" FOR SELECT USING (true);



CREATE POLICY "public read offer_translations" ON "public"."offer_translations" FOR SELECT USING (true);



CREATE POLICY "public read offers" ON "public"."offers" FOR SELECT USING (true);



ALTER TABLE "public"."purchased_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ref_education_level" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ref_education_level_read" ON "public"."ref_education_level" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."ref_housing_type" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ref_housing_type_read" ON "public"."ref_housing_type" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."ref_marital_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ref_marital_status_read" ON "public"."ref_marital_status" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."ref_occupation_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ref_occupation_categories_read" ON "public"."ref_occupation_categories" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."ref_religious_commitment" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ref_religious_commitment_read" ON "public"."ref_religious_commitment" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."report_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_mediator_read" ON "public"."mediator_reviews" FOR SELECT USING ((("mediator_id" = "auth"."uid"()) OR ("id" = "auth"."uid"())));



CREATE POLICY "select_own_handshake" ON "public"."auth_handshakes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "service role can read handshakes" ON "public"."auth_handshakes" FOR SELECT TO "service_role" USING (true);



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions_select_own" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((("mediator_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "system inserts notifications" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("from_user" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "update_likes" ON "public"."likes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "from_user"));



CREATE POLICY "user can insert own deletion request" ON "public"."account_deletion_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user creates own blocks" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "user deletes own blocks" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "user manages own tokens" ON "public"."fcm_tokens" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "user reads own transactions" ON "public"."point_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user sees own blocks" ON "public"."blocks" FOR SELECT USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "user sees own deletion requests" ON "public"."account_deletion_requests" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user sees own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "user updates own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "user_insert_credit_gift_tx" ON "public"."gift_transactions" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND ("amount" > 0)));



CREATE POLICY "user_read_own_gift_tx" ON "public"."gift_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users can insert own fcm token" ON "public"."fcm_tokens" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users can update own fcm token" ON "public"."fcm_tokens" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users can view own fcm token" ON "public"."fcm_tokens" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_can_delete_their_blocks" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "users_can_insert_blocks" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "users_can_view_their_blocks" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "blocker_id") OR ("auth"."uid"() = "blocked_id")));



CREATE POLICY "users_delete_only_own_messages" ON "public"."messages" FOR DELETE USING (("auth"."uid"() = "sender_id"));



ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wallets_insert_service" ON "public"."wallets" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "إرسال بلاغ" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "reporter_id"));



CREATE POLICY "الوسطاء يمكنهم إدارة ملاحظاتهم فق" ON "public"."mediator_notes" USING (("auth"."uid"() = "mediator_id"));



CREATE POLICY "قراءة إعجاباتي" ON "public"."likes" FOR SELECT USING ((("auth"."uid"() = "from_user") OR ("auth"."uid"() = "to_user")));



CREATE POLICY "قراءة الإعدادات" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "قراءة الاهتمامات" ON "public"."interests_options" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."blocks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."gift_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."wallets";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































REVOKE ALL ON FUNCTION "public"."add_bonus_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_bonus_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."add_points"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_points"("p_user_id" "uuid", "p_amount" integer, "p_type" "text", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_welcome_bonus"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_welcome_bonus"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_welcome_bonus"() TO "service_role";
GRANT ALL ON FUNCTION "public"."apply_welcome_bonus"() TO "anon";



REVOKE ALL ON FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."calculate_mediator_level"("subscribers_count" integer) TO "anon";



REVOKE ALL ON FUNCTION "public"."can_create_report"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."can_create_report"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_report"("user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."can_create_report"("user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."check_daily_reward"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_daily_reward"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_daily_reward"() TO "service_role";
GRANT ALL ON FUNCTION "public"."check_daily_reward"() TO "anon";



REVOKE ALL ON FUNCTION "public"."check_for_match"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_for_match"() TO "service_role";
GRANT ALL ON FUNCTION "public"."check_for_match"() TO "anon";



REVOKE ALL ON FUNCTION "public"."check_match_on_like"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_match_on_like"() TO "service_role";
GRANT ALL ON FUNCTION "public"."check_match_on_like"() TO "anon";



REVOKE ALL ON FUNCTION "public"."claim_activity_reward"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_activity_reward"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_activity_reward"() TO "service_role";
GRANT ALL ON FUNCTION "public"."claim_activity_reward"() TO "anon";



REVOKE ALL ON FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."claim_daily_bonus"("p_user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."clean_old_unmatched_likes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clean_old_unmatched_likes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_unmatched_likes"() TO "service_role";
GRANT ALL ON FUNCTION "public"."clean_old_unmatched_likes"() TO "anon";



REVOKE ALL ON FUNCTION "public"."cleanup_inactive_accounts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_inactive_accounts"() TO "service_role";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_accounts"() TO "anon";



REVOKE ALL ON FUNCTION "public"."cleanup_inactive_fcm_tokens"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cleanup_inactive_fcm_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_fcm_tokens"() TO "service_role";
GRANT ALL ON FUNCTION "public"."cleanup_inactive_fcm_tokens"() TO "anon";



REVOKE ALL ON FUNCTION "public"."create_mediator_pricing"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_mediator_pricing"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_mediator_pricing"() TO "anon";



REVOKE ALL ON FUNCTION "public"."create_mediator_wallet"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_mediator_wallet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_mediator_wallet"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_mediator_wallet"() TO "anon";



REVOKE ALL ON FUNCTION "public"."create_notification_on_new_message"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_notification_on_new_message"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_notification_on_new_message"() TO "anon";



REVOKE ALL ON FUNCTION "public"."create_wallet_on_profile"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_wallet_on_profile"() TO "service_role";
GRANT ALL ON FUNCTION "public"."create_wallet_on_profile"() TO "anon";



REVOKE ALL ON FUNCTION "public"."deduct_points"("activity_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deduct_points"("activity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_points"("activity_type" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."deduct_points"("activity_type" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."deduct_points"("p_user_id" "uuid", "p_amount" integer, "p_desc" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."delete_listened_voice_messages"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_listened_voice_messages"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_listened_voice_messages"() TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_listened_voice_messages"() TO "anon";



REVOKE ALL ON FUNCTION "public"."delete_my_account"("p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_my_account"("p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_my_account"("p_reason" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."delete_my_account"("p_reason" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."disable_my_account"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."disable_my_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."disable_my_account"() TO "service_role";
GRANT ALL ON FUNCTION "public"."disable_my_account"() TO "anon";



REVOKE ALL ON FUNCTION "public"."execute_action"("action_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."execute_action"("action_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_action"("action_key" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."execute_action"("action_key" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."execute_user_action"("action_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."execute_user_action"("action_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_user_action"("action_type" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."execute_user_action"("action_type" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."expire_pending_payments"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."expire_pending_payments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_pending_payments"() TO "service_role";
GRANT ALL ON FUNCTION "public"."expire_pending_payments"() TO "anon";



REVOKE ALL ON FUNCTION "public"."get_mediators"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_mediators"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mediators"() TO "service_role";
GRANT ALL ON FUNCTION "public"."get_mediators"() TO "anon";



REVOKE ALL ON FUNCTION "public"."get_nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" double precision, "target_gender" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" double precision, "target_gender" "text") TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("updated_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("gender") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("marital_status") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("age") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("is_completed") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("birth_date") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("country") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("city") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("phone") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("education_level") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("height") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("weight") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("religious_commitment") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("bio") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("interests") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("health_habits") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("is_photos_blurred") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("partner_requirements") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("readiness_level") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("housing_type") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("health_status") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("desire_for_children") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("children_count") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("children_custody") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("financial_status") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("images_data") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("profile_completion_percent") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("nationality") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("has_children") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("skin_color") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("travel_willingness") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("relationship_with_family") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("social_type") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("morning_evening") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("home_time") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("conflict_style") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("affection_style") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("life_priority") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("parenting_style") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("quran_memorization") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("marriage_type") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("preferred_housing") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("beard_style") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("prayer_commitment") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("wife_number") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("smoking") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("hijab_style") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("polygamy_acceptance") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("work_after_marriage") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("full_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("occupation_category_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("occupation_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("last_active_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("show_photos") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("latitude") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("longitude") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("whatsapp") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("tiktok") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("discovery_position") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("coords") ON TABLE "public"."profiles" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_nearby_users"("user_lat" double precision, "user_lon" double precision, "max_dist_km" double precision) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_nearby_users"("user_lat" double precision, "user_lon" double precision, "max_dist_km" double precision) TO "service_role";



REVOKE ALL ON FUNCTION "public"."grant_activity_point"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_activity_point"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_activity_point"() TO "service_role";
GRANT ALL ON FUNCTION "public"."grant_activity_point"() TO "anon";



REVOKE ALL ON FUNCTION "public"."handle_new_subscription"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_subscription"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_subscription"() TO "anon";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";



REVOKE ALL ON FUNCTION "public"."handle_payment_completed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_payment_completed"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_payment_completed"() TO "anon";



REVOKE ALL ON FUNCTION "public"."handle_payout_approved"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_payout_approved"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_payout_approved"() TO "anon";



REVOKE ALL ON FUNCTION "public"."nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" integer, "target_gender" "text", "excluded_ids" "uuid"[], "p_marital_status" integer[], "p_education_level" integer[], "p_religious_commitment" integer[], "p_readiness_level" integer[], "p_occupation_cat" integer[], "p_housing_type" integer[], "p_age_min" integer, "p_age_max" integer, "p_height_min" integer, "p_height_max" integer, "p_weight_min" integer, "p_weight_max" integer, "p_financial_status" "text"[], "p_skin_color" "text"[], "p_travel_willingness" "text"[], "p_desire_for_children" "text"[], "p_health_status" "text"[], "p_smoking" "text"[], "p_hijab_style" "text"[], "p_beard_style" "text"[], "p_prayer_commitment" "text"[], "p_quran_memorization" "text"[], "p_polygamy_acceptance" "text"[], "p_work_after_marriage" "text"[], "p_preferred_housing" "text"[], "p_social_type" "text"[], "p_morning_evening" "text"[], "p_conflict_style" "text"[], "p_affection_style" "text"[], "p_life_priority" "text"[], "p_parenting_style" "text"[], "p_relationship_with_family" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" integer, "target_gender" "text", "excluded_ids" "uuid"[], "p_marital_status" integer[], "p_education_level" integer[], "p_religious_commitment" integer[], "p_readiness_level" integer[], "p_occupation_cat" integer[], "p_housing_type" integer[], "p_age_min" integer, "p_age_max" integer, "p_height_min" integer, "p_height_max" integer, "p_weight_min" integer, "p_weight_max" integer, "p_financial_status" "text"[], "p_skin_color" "text"[], "p_travel_willingness" "text"[], "p_desire_for_children" "text"[], "p_health_status" "text"[], "p_smoking" "text"[], "p_hijab_style" "text"[], "p_beard_style" "text"[], "p_prayer_commitment" "text"[], "p_quran_memorization" "text"[], "p_polygamy_acceptance" "text"[], "p_work_after_marriage" "text"[], "p_preferred_housing" "text"[], "p_social_type" "text"[], "p_morning_evening" "text"[], "p_conflict_style" "text"[], "p_affection_style" "text"[], "p_life_priority" "text"[], "p_parenting_style" "text"[], "p_relationship_with_family" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."nearby_profiles"("user_lat" double precision, "user_lon" double precision, "radius_km" integer, "target_gender" "text", "excluded_ids" "uuid"[], "p_marital_status" integer[], "p_education_level" integer[], "p_religious_commitment" integer[], "p_readiness_level" integer[], "p_occupation_cat" integer[], "p_housing_type" integer[], "p_age_min" integer, "p_age_max" integer, "p_height_min" integer, "p_height_max" integer, "p_weight_min" integer, "p_weight_max" integer, "p_financial_status" "text"[], "p_skin_color" "text"[], "p_travel_willingness" "text"[], "p_desire_for_children" "text"[], "p_health_status" "text"[], "p_smoking" "text"[], "p_hijab_style" "text"[], "p_beard_style" "text"[], "p_prayer_commitment" "text"[], "p_quran_memorization" "text"[], "p_polygamy_acceptance" "text"[], "p_work_after_marriage" "text"[], "p_preferred_housing" "text"[], "p_social_type" "text"[], "p_morning_evening" "text"[], "p_conflict_style" "text"[], "p_affection_style" "text"[], "p_life_priority" "text"[], "p_parenting_style" "text"[], "p_relationship_with_family" "text"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."notify_on_like"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."notify_on_like"() TO "service_role";
GRANT ALL ON FUNCTION "public"."notify_on_like"() TO "anon";



REVOKE ALL ON FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."process_mediator_payment"("sender_uid" "uuid", "receiver_uid" "uuid", "points_amount" integer, "service_name" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() TO "service_role";
GRANT ALL ON FUNCTION "public"."protect_profile_sensitive_columns"() TO "anon";



REVOKE ALL ON FUNCTION "public"."reactivate_account"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reactivate_account"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reactivate_account"("p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."reactivate_account"("p_user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."request_mediation"("p_user_id" "uuid", "p_mediator_id" "uuid", "p_message" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."set_subscriber_verification"("p_subscriber_id" "uuid", "p_status" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."smart_deduct_points"("action_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."smart_deduct_points"("action_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."smart_deduct_points"("action_type" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."smart_deduct_points"("action_type" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."spend_general_points"("user_uid" "uuid", "points_amount" integer, "service_name" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."spend_points"("points_to_spend" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."spend_points"("points_to_spend" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_points"("points_to_spend" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."spend_points"("points_to_spend" integer) TO "anon";



REVOKE ALL ON FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) TO "service_role";
GRANT ALL ON FUNCTION "public"."spend_points"("user_uid" "uuid", "amount" integer, "is_mediator_view" boolean) TO "anon";



REVOKE ALL ON FUNCTION "public"."spend_points_smart"("action_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."spend_points_smart"("action_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_points_smart"("action_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."spend_points_smart"("action_name" "text") TO "anon";



REVOKE ALL ON FUNCTION "public"."spend_user_points"("cost" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."spend_user_points"("cost" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."spend_user_points"("cost" integer) TO "service_role";
GRANT ALL ON FUNCTION "public"."spend_user_points"("cost" integer) TO "anon";



REVOKE ALL ON FUNCTION "public"."sync_coords"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_coords"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_coords"() TO "service_role";
GRANT ALL ON FUNCTION "public"."sync_coords"() TO "anon";



REVOKE ALL ON FUNCTION "public"."sync_wallet_name"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_wallet_name"() TO "service_role";
GRANT ALL ON FUNCTION "public"."sync_wallet_name"() TO "anon";



REVOKE ALL ON FUNCTION "public"."sync_zawaj_tables"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_zawaj_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_zawaj_tables"() TO "service_role";
GRANT ALL ON FUNCTION "public"."sync_zawaj_tables"() TO "anon";



REVOKE ALL ON FUNCTION "public"."trigger_send_push_notification"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."trigger_send_push_notification"() TO "service_role";
GRANT ALL ON FUNCTION "public"."trigger_send_push_notification"() TO "anon";



REVOKE ALL ON FUNCTION "public"."update_conversation_on_new_message"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_conversation_on_new_message"() TO "service_role";
GRANT ALL ON FUNCTION "public"."update_conversation_on_new_message"() TO "anon";



REVOKE ALL ON FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text", "p_country" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text", "p_country" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text", "p_country" "text") TO "service_role";
GRANT ALL ON FUNCTION "public"."update_user_location"("p_user_id" "uuid", "p_lat" double precision, "p_lon" double precision, "p_city" "text", "p_country" "text") TO "anon";























































































GRANT ALL ON TABLE "public"."account_deletion_requests" TO "anon";
GRANT ALL ON TABLE "public"."account_deletion_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."account_deletion_requests" TO "service_role";



GRANT ALL ON TABLE "public"."accounts_pending_deletion" TO "service_role";



GRANT ALL ON TABLE "public"."app_categories" TO "anon";
GRANT ALL ON TABLE "public"."app_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."app_categories" TO "service_role";



GRANT ALL ON TABLE "public"."app_images" TO "anon";
GRANT ALL ON TABLE "public"."app_images" TO "authenticated";
GRANT ALL ON TABLE "public"."app_images" TO "service_role";



GRANT ALL ON TABLE "public"."app_meta" TO "anon";
GRANT ALL ON TABLE "public"."app_meta" TO "authenticated";
GRANT ALL ON TABLE "public"."app_meta" TO "service_role";



GRANT ALL ON TABLE "public"."apps" TO "anon";
GRANT ALL ON TABLE "public"."apps" TO "authenticated";
GRANT ALL ON TABLE "public"."apps" TO "service_role";



GRANT ALL ON TABLE "public"."auth_handshakes" TO "anon";
GRANT ALL ON TABLE "public"."auth_handshakes" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_handshakes" TO "service_role";



GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."content_moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."content_moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."content_moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."economy_config" TO "anon";
GRANT ALL ON TABLE "public"."economy_config" TO "authenticated";
GRANT ALL ON TABLE "public"."economy_config" TO "service_role";



GRANT ALL ON TABLE "public"."fcm_tokens" TO "anon";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."fcm_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."feature_details" TO "anon";
GRANT ALL ON TABLE "public"."feature_details" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_details" TO "service_role";



GRANT ALL ON TABLE "public"."feature_details_translations" TO "anon";
GRANT ALL ON TABLE "public"."feature_details_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_details_translations" TO "service_role";



GRANT ALL ON TABLE "public"."feature_translations" TO "anon";
GRANT ALL ON TABLE "public"."feature_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_translations" TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON TABLE "public"."gift_transactions" TO "anon";
GRANT ALL ON TABLE "public"."gift_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."gift_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."interests_options" TO "anon";
GRANT ALL ON TABLE "public"."interests_options" TO "authenticated";
GRANT ALL ON TABLE "public"."interests_options" TO "service_role";



GRANT ALL ON TABLE "public"."konnect_payments" TO "anon";
GRANT ALL ON TABLE "public"."konnect_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."konnect_payments" TO "service_role";



GRANT ALL ON TABLE "public"."likes" TO "anon";
GRANT ALL ON TABLE "public"."likes" TO "authenticated";
GRANT ALL ON TABLE "public"."likes" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_clients" TO "anon";
GRANT ALL ON TABLE "public"."mediator_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_clients" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_earnings" TO "anon";
GRANT ALL ON TABLE "public"."mediator_earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_earnings" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_notes" TO "anon";
GRANT ALL ON TABLE "public"."mediator_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_notes" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_pricing" TO "anon";
GRANT ALL ON TABLE "public"."mediator_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_pricing" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_reviews" TO "anon";
GRANT ALL ON TABLE "public"."mediator_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_subscriber_info" TO "anon";
GRANT ALL ON TABLE "public"."mediator_subscriber_info" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_subscriber_info" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."mediator_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."mediator_wallets" TO "anon";
GRANT ALL ON TABLE "public"."mediator_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."mediator_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."mediators_view" TO "anon";
GRANT ALL ON TABLE "public"."mediators_view" TO "authenticated";
GRANT ALL ON TABLE "public"."mediators_view" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offer_feature_translations" TO "anon";
GRANT ALL ON TABLE "public"."offer_feature_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_feature_translations" TO "service_role";



GRANT ALL ON TABLE "public"."offer_features" TO "anon";
GRANT ALL ON TABLE "public"."offer_features" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_features" TO "service_role";



GRANT ALL ON TABLE "public"."offer_limits" TO "anon";
GRANT ALL ON TABLE "public"."offer_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_limits" TO "service_role";



GRANT ALL ON TABLE "public"."offer_translations" TO "anon";
GRANT ALL ON TABLE "public"."offer_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."offer_translations" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."payment_usages" TO "anon";
GRANT ALL ON TABLE "public"."payment_usages" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_usages" TO "service_role";



GRANT ALL ON TABLE "public"."payouts" TO "anon";
GRANT ALL ON TABLE "public"."payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."payouts" TO "service_role";



GRANT ALL ON TABLE "public"."point_transactions" TO "anon";
GRANT ALL ON TABLE "public"."point_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchased_points" TO "anon";
GRANT ALL ON TABLE "public"."purchased_points" TO "authenticated";
GRANT ALL ON TABLE "public"."purchased_points" TO "service_role";



GRANT ALL ON TABLE "public"."ref_education_level" TO "anon";
GRANT ALL ON TABLE "public"."ref_education_level" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_education_level" TO "service_role";



GRANT ALL ON TABLE "public"."ref_housing_type" TO "anon";
GRANT ALL ON TABLE "public"."ref_housing_type" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_housing_type" TO "service_role";



GRANT ALL ON TABLE "public"."ref_marital_status" TO "anon";
GRANT ALL ON TABLE "public"."ref_marital_status" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_marital_status" TO "service_role";



GRANT ALL ON TABLE "public"."ref_occupation_categories" TO "anon";
GRANT ALL ON TABLE "public"."ref_occupation_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_occupation_categories" TO "service_role";



GRANT ALL ON TABLE "public"."ref_religious_commitment" TO "anon";
GRANT ALL ON TABLE "public"."ref_religious_commitment" TO "authenticated";
GRANT ALL ON TABLE "public"."ref_religious_commitment" TO "service_role";



GRANT ALL ON TABLE "public"."report_attachments" TO "anon";
GRANT ALL ON TABLE "public"."report_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."report_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."wallets" TO "anon";
GRANT ALL ON TABLE "public"."wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets" TO "service_role";



GRANT ALL ON TABLE "public"."wallets_view" TO "anon";
GRANT ALL ON TABLE "public"."wallets_view" TO "authenticated";
GRANT ALL ON TABLE "public"."wallets_view" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































