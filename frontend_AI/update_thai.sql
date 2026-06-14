-- ============================================================
-- 🇹🇭 UPDATE ข้อมูลทั้งหมดเป็นภาษาไทย (ปลอดภัย — ไม่ลบข้อมูลเก่า)
-- วิธีใช้: คัดลอกไปวางใน Supabase SQL Editor แล้วกด Run
-- ============================================================

-- ==========================================
-- 1. UPDATE ตาราง users (ชื่อผู้ใช้)
-- ==========================================
UPDATE public.users SET name = 'สมชาย ใจดี'        WHERE user_id = 'u001';
UPDATE public.users SET name = 'อลิซ สมิธ'          WHERE user_id = 'u002';
UPDATE public.users SET name = 'มานะ ดี'             WHERE user_id = 'u003';
UPDATE public.users SET name = 'สมศรี ใจงาม'        WHERE user_id = 'u004';
UPDATE public.users SET name = 'จอห์น โด'            WHERE user_id = 'u005';
UPDATE public.users SET name = 'ประสิทธิ์ กุ้ง'      WHERE user_id = 'u006';
UPDATE public.users SET name = 'แมรี่ จอห์นสัน'     WHERE user_id = 'u007';
UPDATE public.users SET name = 'วิภา รัตนาภรณ์'     WHERE user_id = 'u008';
UPDATE public.users SET name = 'เคนจิ ซาโต้'        WHERE user_id = 'u009';
UPDATE public.users SET name = 'นิดา พัชรา'          WHERE user_id = 'u010';
UPDATE public.users SET name = 'เดวิด บราวน์'       WHERE user_id = 'u011';
UPDATE public.users SET name = 'กานดา มั่นคง'        WHERE user_id = 'u012';
UPDATE public.users SET name = 'ซาร่า ลี'            WHERE user_id = 'u013';
UPDATE public.users SET name = 'อาทิตย์ สุริยา'     WHERE user_id = 'u014';
UPDATE public.users SET name = 'พิมพ์ชนก เลือ'     WHERE user_id = 'u015';

-- ==========================================
-- 2. UPDATE ตาราง doctors (ชื่อแพทย์ + แผนก)
-- ==========================================
UPDATE public.doctors SET name = 'นพ. อลิซ สมิธ',        department = 'จิตเวช'           WHERE doctor_id = 'doc-01';
UPDATE public.doctors SET name = 'นพ. เคนจิ โรดริเกซ',    department = 'ผิวหนัง'          WHERE doctor_id = 'doc-02';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ จอห์นสัน', department = 'สูตินรีเวช'    WHERE doctor_id = 'doc-03';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ ซาโต้',  department = 'สูตินรีเวช'      WHERE doctor_id = 'doc-04';
UPDATE public.doctors SET name = 'นพ. ซาร่า บราวน์',      department = 'ผิวหนัง'          WHERE doctor_id = 'doc-05';
UPDATE public.doctors SET name = 'นพ. เคนจิ ใจงาม',       department = 'โรคหัวใจ'         WHERE doctor_id = 'doc-06';
UPDATE public.doctors SET name = 'นพ. ไมเคิล ลี',         department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-07';
UPDATE public.doctors SET name = 'นพ. ไมเคิล ใจดี',       department = 'กุมารเวช'         WHERE doctor_id = 'doc-08';
UPDATE public.doctors SET name = 'นพ. สมชาย สุริยา',      department = 'กุมารเวช'         WHERE doctor_id = 'doc-09';
UPDATE public.doctors SET name = 'นพ. นิดา โจนส์',        department = 'ระบบทางเดินปัสสาวะ' WHERE doctor_id = 'doc-10';
UPDATE public.doctors SET name = 'นพ. ประสิทธิ์ สมิธ',    department = 'ผิวหนัง'          WHERE doctor_id = 'doc-11';
UPDATE public.doctors SET name = 'นพ. แมรี่ วิลสัน',      department = 'จิตเวช'           WHERE doctor_id = 'doc-12';
UPDATE public.doctors SET name = 'นพ. วิภา วิลเลียมส์',   department = 'กุมารเวช'         WHERE doctor_id = 'doc-13';
UPDATE public.doctors SET name = 'นพ. ไมเคิล พัชรา',      department = 'ระบบประสาท'       WHERE doctor_id = 'doc-14';
UPDATE public.doctors SET name = 'นพ. นิดา วิลเลียมส์',   department = 'กุมารเวช'         WHERE doctor_id = 'doc-15';
UPDATE public.doctors SET name = 'นพ. เดวิด ซาโต้',       department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-16';
UPDATE public.doctors SET name = 'นพ. ไมเคิล บราวน์',     department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-17';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ ใจงาม', department = 'ระบบทางเดินปัสสาวะ' WHERE doctor_id = 'doc-18';
UPDATE public.doctors SET name = 'นพ. เคนจิ มั่นคง',      department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-19';
UPDATE public.doctors SET name = 'นพ. วิภา โด',            department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-20';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ ลี',     department = 'ระบบทางเดินปัสสาวะ' WHERE doctor_id = 'doc-21';
UPDATE public.doctors SET name = 'นพ. วิภา พัชรา',         department = 'ระบบทางเดินปัสสาวะ' WHERE doctor_id = 'doc-22';
UPDATE public.doctors SET name = 'นพ. เดวิด ใจดี',        department = 'ระบบทางเดินปัสสาวะ' WHERE doctor_id = 'doc-23';
UPDATE public.doctors SET name = 'นพ. ปีเตอร์ โด',         department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-24';
UPDATE public.doctors SET name = 'นพ. ไมเคิล โจนส์',      department = 'ระบบประสาท'       WHERE doctor_id = 'doc-25';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ ใจดี',  department = 'ออร์โธปิดิกส์'    WHERE doctor_id = 'doc-26';
UPDATE public.doctors SET name = 'นพ. เดวิด สุริยา',      department = 'จิตเวช'           WHERE doctor_id = 'doc-27';
UPDATE public.doctors SET name = 'นพ. วิภา วิลเลียมส์',   department = 'กุมารเวช'         WHERE doctor_id = 'doc-28';
UPDATE public.doctors SET name = 'นพ. ลินดา ซาโต้',       department = 'จิตเวช'           WHERE doctor_id = 'doc-29';
UPDATE public.doctors SET name = 'นพ. ซาร่า มิลเลอร์',    department = 'ออร์โธปิดิกส์'    WHERE doctor_id = 'doc-30';
UPDATE public.doctors SET name = 'นพ. สมศักดิ์ มั่นคง',   department = 'ผิวหนัง'          WHERE doctor_id = 'doc-31';
UPDATE public.doctors SET name = 'นพ. โรเบิร์ต สุริยา',   department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-32';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ การ์เซีย', department = 'โรคหัวใจ'      WHERE doctor_id = 'doc-33';
UPDATE public.doctors SET name = 'นพ. ไมเคิล มิลเลอร์',   department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-34';
UPDATE public.doctors SET name = 'นพ. วิภา มั่นคง',        department = 'กุมารเวช'         WHERE doctor_id = 'doc-35';
UPDATE public.doctors SET name = 'นพ. ปีเตอร์ ใจงาม',     department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-36';
UPDATE public.doctors SET name = 'นพ. เจนนิเฟอร์ ใจดี',  department = 'ระบบประสาท'       WHERE doctor_id = 'doc-37';
UPDATE public.doctors SET name = 'นพ. แมรี่ ใจงาม',       department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-38';
UPDATE public.doctors SET name = 'นพ. แมรี่ โด',           department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-39';
UPDATE public.doctors SET name = 'นพ. จอห์น จอห์นสัน',    department = 'กุมารเวช'         WHERE doctor_id = 'doc-40';
UPDATE public.doctors SET name = 'นพ. เจมส์ สมิธ',        department = 'ออร์โธปิดิกส์'    WHERE doctor_id = 'doc-41';
UPDATE public.doctors SET name = 'นพ. นิดา การ์เซีย',      department = 'ออร์โธปิดิกส์'    WHERE doctor_id = 'doc-42';
UPDATE public.doctors SET name = 'นพ. นิดา ใจงาม',         department = 'ผิวหนัง'          WHERE doctor_id = 'doc-43';
UPDATE public.doctors SET name = 'นพ. อลิซ เดวิส',         department = 'โรคหัวใจ'         WHERE doctor_id = 'doc-44';
UPDATE public.doctors SET name = 'นพ. อลิซ สุริยา',        department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-45';
UPDATE public.doctors SET name = 'นพ. สมชาย การ์เซีย',     department = 'โรคหัวใจ'         WHERE doctor_id = 'doc-46';
UPDATE public.doctors SET name = 'นพ. แมรี่ วิลสัน',       department = 'สูตินรีเวช'       WHERE doctor_id = 'doc-47';
UPDATE public.doctors SET name = 'นพ. แมรี่ เลือ',          department = 'กุมารเวช'         WHERE doctor_id = 'doc-48';
UPDATE public.doctors SET name = 'นพ. วิภา เดวิส',          department = 'ผิวหนัง'          WHERE doctor_id = 'doc-49';
UPDATE public.doctors SET name = 'นพ. นิดา เดวิส',          department = 'มะเร็งวิทยา'      WHERE doctor_id = 'doc-50';

-- ==========================================
-- 3. UPDATE ตาราง appointments (อาการ — symptom)
-- ==========================================
-- แปลทีละประเภทอาการโดยใช้ UPDATE ... WHERE symptom = '...'
UPDATE public.appointments SET symptom = 'ปวดหัว'               WHERE symptom = 'Headache';
UPDATE public.appointments SET symptom = 'อาหารเป็นพิษ'         WHERE symptom = 'Food Poisoning';
UPDATE public.appointments SET symptom = 'ตรวจสุขภาพประจำปี'   WHERE symptom = 'Annual Checkup';
UPDATE public.appointments SET symptom = 'เจ็บคอ'               WHERE symptom = 'Sore throat';
UPDATE public.appointments SET symptom = 'โควิด-19'             WHERE symptom = 'Covid-19';
UPDATE public.appointments SET symptom = 'ไข้เลือดออก'          WHERE symptom = 'Dengue Fever';
UPDATE public.appointments SET symptom = 'ตรวจครรภ์'            WHERE symptom = 'Pregnancy checkup';
UPDATE public.appointments SET symptom = 'ฉีดวัคซีน'            WHERE symptom = 'Vaccination';
UPDATE public.appointments SET symptom = 'ปวดฟัน'               WHERE symptom = 'Toothache';
UPDATE public.appointments SET symptom = 'ผื่นคัน'              WHERE symptom = 'Skin rash';
UPDATE public.appointments SET symptom = 'ท้องเสีย'             WHERE symptom = 'Diarrhea';
UPDATE public.appointments SET symptom = 'เวียนหัว'             WHERE symptom = 'Dizziness';
UPDATE public.appointments SET symptom = 'ปวดท้อง'              WHERE symptom = 'Stomach ache';
UPDATE public.appointments SET symptom = 'แพ้ภูมิ'              WHERE symptom = 'Allergy';
UPDATE public.appointments SET symptom = 'สิวอักเสบ'            WHERE symptom = 'Acne';
UPDATE public.appointments SET symptom = 'ไข้หวัดใหญ่'         WHERE symptom = 'Flu symptoms';
UPDATE public.appointments SET symptom = 'ปวดหลัง'              WHERE symptom = 'Back pain';
UPDATE public.appointments SET symptom = 'เจ็บหน้าอก'           WHERE symptom = 'Chest pain';
UPDATE public.appointments SET symptom = 'ปัญหาการมองเห็น'      WHERE symptom = 'Vision problem';
UPDATE public.appointments SET symptom = 'ปวดข้อ'               WHERE symptom = 'Joint pain';
UPDATE public.appointments SET symptom = 'ความผิดปกติของการนอน' WHERE symptom = 'Sleep disorder';

-- ==========================================
-- 4. UPDATE ตาราง reviews (comment — ความคิดเห็น)
-- ==========================================
UPDATE public.reviews SET comment = 'แพงเกินไปสำหรับสิ่งที่ได้รับ'
  WHERE review_id = 'rev-1001';
UPDATE public.reviews SET comment = 'อาหารเช้าอร่อยมาก'
  WHERE review_id = 'rev-1002';
UPDATE public.reviews SET comment = 'นัดถูกยกเลิกในนาทีสุดท้าย ไม่ประทับใจเลย'
  WHERE review_id = 'rev-1003';
UPDATE public.reviews SET comment = 'อาหารเช้าอร่อยมาก'
  WHERE review_id = 'rev-1004';
UPDATE public.reviews SET comment = 'อาหารเช้าน่าผิดหวัง'
  WHERE review_id = 'rev-1005';
UPDATE public.reviews SET comment = 'ตรงตามที่ต้องการพอดีเลย'
  WHERE review_id = 'rev-1006';
UPDATE public.reviews SET comment = 'มืออาชีพและใจดีมากครับ'
  WHERE review_id = 'rev-1007';
UPDATE public.reviews SET comment = 'บริเวณสระว่ายน้ำสุดยอดมาก'
  WHERE review_id = 'rev-1008';
UPDATE public.reviews SET comment = 'ตรงตามที่ต้องการพอดีเลย'
  WHERE review_id = 'rev-1009';
UPDATE public.reviews SET comment = 'แอร์ไม่ทำงานเลย'
  WHERE review_id = 'rev-1010';
UPDATE public.reviews SET comment = 'ไม่ตรงตามคำอธิบายในเว็บ'
  WHERE review_id = 'rev-1011';
UPDATE public.reviews SET comment = 'มีทักษะและความรู้สูงมากครับ'
  WHERE review_id = 'rev-1012';
UPDATE public.reviews SET comment = 'ใช้งานได้แค่สัปดาห์เดียวก็พัง'
  WHERE review_id = 'rev-1013';
UPDATE public.reviews SET comment = 'วิวสวยงาม เจ้าหน้าที่เป็นมิตรมาก'
  WHERE review_id = 'rev-1014';
UPDATE public.reviews SET comment = 'ช่วยให้หายได้เร็วมาก ขอบคุณมากครับ'
  WHERE review_id = 'rev-1015';
UPDATE public.reviews SET comment = 'ไม่คุ้มราคาเลยครับ'
  WHERE review_id = 'rev-1016';
UPDATE public.reviews SET comment = 'ทำเลดีมาก ใกล้ทุกที่เลย'
  WHERE review_id = 'rev-1017';
UPDATE public.reviews SET comment = 'รอไม่นานเลย บริการรวดเร็ว'
  WHERE review_id = 'rev-1018';
UPDATE public.reviews SET comment = 'เจ้าหน้าที่ไม่ค่อยให้ความช่วยเหลือเท่าไหร่'
  WHERE review_id = 'rev-1019';
UPDATE public.reviews SET comment = 'คุณภาพดีมาก แนะนำเลยครับ!'
  WHERE review_id = 'rev-1020';
UPDATE public.reviews SET comment = 'จัดส่งเร็วมาก บรรจุภัณฑ์ดีมาก'
  WHERE review_id = 'rev-1021';
UPDATE public.reviews SET comment = 'มีทักษะและความรู้สูงมากครับ'
  WHERE review_id = 'rev-1022';
UPDATE public.reviews SET comment = 'ช่วยให้หายได้เร็วมาก ขอบคุณมากครับ'
  WHERE review_id = 'rev-1023';
UPDATE public.reviews SET comment = 'จัดส่งเร็วมาก บรรจุภัณฑ์ดีมาก'
  WHERE review_id = 'rev-1024';
UPDATE public.reviews SET comment = 'คุณภาพดีมาก แนะนำเลยครับ!'
  WHERE review_id = 'rev-1025';
UPDATE public.reviews SET comment = 'ใช้งานได้แค่สัปดาห์เดียวก็พัง'
  WHERE review_id = 'rev-1026';
UPDATE public.reviews SET comment = 'จัดส่งเร็วมาก บรรจุภัณฑ์ดีมาก'
  WHERE review_id = 'rev-1027';
UPDATE public.reviews SET comment = 'จัดส่งเร็วมาก บรรจุภัณฑ์ดีมาก'
  WHERE review_id = 'rev-1028';
UPDATE public.reviews SET comment = 'พนักงานหยาบคายมาก ไม่ประทับใจ'
  WHERE review_id = 'rev-1029';
UPDATE public.reviews SET comment = 'แอร์ไม่ทำงานเลย'
  WHERE review_id = 'rev-1030';
UPDATE public.reviews SET comment = 'ชอบดีไซน์และคุณภาพการสร้างมากครับ'
  WHERE review_id = 'rev-1031';
UPDATE public.reviews SET comment = 'มืออาชีพและใจดีมากครับ'
  WHERE review_id = 'rev-1032';
UPDATE public.reviews SET comment = 'ยาที่สั่งไม่ได้ผลเลย ผิดหวังมาก'
  WHERE review_id = 'rev-1033';
UPDATE public.reviews SET comment = 'เพื่อนบ้านส่งเสียงดัง ผนังบางมาก'
  WHERE review_id = 'rev-1034';
UPDATE public.reviews SET comment = 'ชอบดีไซน์และคุณภาพการสร้างมากครับ'
  WHERE review_id = 'rev-1035';
UPDATE public.reviews SET comment = 'วิวสวยงาม เจ้าหน้าที่เป็นมิตรมาก'
  WHERE review_id = 'rev-1036';
UPDATE public.reviews SET comment = 'ใช้งานได้แค่สัปดาห์เดียวก็พัง'
  WHERE review_id = 'rev-1037';
UPDATE public.reviews SET comment = 'ห้องสะอาดและกว้างขวางมาก'
  WHERE review_id = 'rev-1038';
UPDATE public.reviews SET comment = 'ช่วยให้หายได้เร็วมาก ขอบคุณมากครับ'
  WHERE review_id = 'rev-1039';
UPDATE public.reviews SET comment = 'ช่วยให้หายได้เร็วมาก ขอบคุณมากครับ'
  WHERE review_id = 'rev-1040';
UPDATE public.reviews SET comment = 'ใช้งานได้ดีเยี่ยมเลยครับ'
  WHERE review_id = 'rev-1041';
UPDATE public.reviews SET comment = 'ใช้งานได้ดีเยี่ยมเลยครับ'
  WHERE review_id = 'rev-1042';
UPDATE public.reviews SET comment = 'รอนานมากเกินไป ไม่ประทับใจ'
  WHERE review_id = 'rev-1043';
UPDATE public.reviews SET comment = 'รอไม่นานเลย บริการรวดเร็ว'
  WHERE review_id = 'rev-1044';
UPDATE public.reviews SET comment = 'จัดส่งเร็วมาก บรรจุภัณฑ์ดีมาก'
  WHERE review_id = 'rev-1045';
UPDATE public.reviews SET comment = 'ยาที่สั่งไม่ได้ผลเลย ผิดหวังมาก'
  WHERE review_id = 'rev-1046';
UPDATE public.reviews SET comment = 'เพื่อนบ้านส่งเสียงดัง ผนังบางมาก'
  WHERE review_id = 'rev-1047';
UPDATE public.reviews SET comment = 'รอนานมากเกินไป ไม่ประทับใจ'
  WHERE review_id = 'rev-1048';
UPDATE public.reviews SET comment = 'จัดส่งใช้เวลานานมากเกินไป'
  WHERE review_id = 'rev-1049';
UPDATE public.reviews SET comment = 'ช่วยให้หายได้เร็วมาก ขอบคุณมากครับ'
  WHERE review_id = 'rev-1050';

-- ==========================================
-- ✅ เสร็จสิ้น — ข้อมูลทั้งหมดถูกแปลเป็นภาษาไทย
-- ==========================================
