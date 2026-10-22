# Rojgar Sathi — जल्दी सेटअप

1. इस ZIP को extract करें।
2. Supabase में नया project बनाएँ; SQL Editor में `supabase/schema.sql` पूरा चलाएँ।
3. Authentication > Users में अपना admin user बनाएँ।
4. SQL Editor में चलाएँ (ईमेल बदलें):
   `insert into public.admin_users (user_id) select id from auth.users where email = 'YOUR-ADMIN-EMAIL';`
5. `.env.example` की कॉपी `.env.local` नाम से बनाएँ और Supabase URL + anon/publishable key भरें।
6. कंप्यूटर पर Node.js 20+ स्थापित करके project folder में `npm install` फिर `npm run dev` चलाएँ।
7. `http://localhost:3000/admin/login` पर login करें; appearance और jobs सेट करें।
8. GitHub में नई repository `rojgar-sathi` बनाएँ और इस folder की files upload करें। Vercel में उसी नई repository को import करके environment variables भरें।
9. Native Android Play Store build, push notifications और AdSense script approval/verification अलग deployment tasks हैं; उन्हें production में जाने से पहले पूरा करें।

**सुरक्षा:** service-role key कभी `.env.local` के `NEXT_PUBLIC_` नाम वाले variable में न रखें और GitHub पर `.env.local` upload न करें।
