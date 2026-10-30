# 🏗️ สถาปัตยกรรมระบบและโครงสร้างเทคโนโลยี (System Architecture & Tech Stack)
**โครงการ:** ระบบจัดการนิติบุคคลหมู่บ้านจัดสรร (HOA Management System)  
**อัปเดตล่าสุด:** 30 ตุลาคม 2026 (2569)  

---

## 📌 1. ภาพรวมสถาปัตยกรรมระบบ (System Overview)

ระบบ HOA Management พัฒนาขึ้นเป็นเว็บแอปพลิเคชันแบบ **Single Page Application (SPA)** บนสถาปัตยกรรม **Cloud-Native & Serverless** ทำงานร่วมกับ **Cloud PostgreSQL Database** และ **Cloud Storage** ทำให้สามารถเข้าใช้งานได้ 24 ชั่วโมงจากทุกอุปกรณ์ (คอมพิวเตอร์, แท็บเล็ต, สมาร์ทโฟน) โดยไม่ต้องเปิดเซิร์ฟเวอร์ไว้ในสำนักงานนิติฯ

```
[ ผู้ใช้งาน (Web Browser / มือถือ / แท็บเล็ต) ]
                      │
                      ▼
        ┌──────────────────────────┐
        │   Vercel Cloud Platform  │
        ├──────────────────────────┤
        │ 1. Frontend (React 19)   │
        │ 2. Backend Serverless API│
        │    (Express + Prisma)    │
        └─────────────┬────────────┘
                      │
        ┌─────────────┼──────────────┐
        ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase    │ │  Supabase    │ │ Google Drive │
│  PostgreSQL  │ │  Storage     │ │     CDN      │
│  (Database)  │ │ (Slips/Docs) │ │ (Old Bills)  │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🛠️ 2. รายละเอียดแพลตฟอร์มและเทคโนโลยีหลัก (Core Tech Stack)

### 2.1 Web Hosting & Serverless Backend
* **แพลตฟอร์ม:** **Vercel** (`https://hoa-management-vert.vercel.app/`)
* **หน้าที่:**
  - โฮสต์และให้บริการหน้าเว็บ Single Page Application แบบ 24/7 ความเร็วสูง
  - ประมวลผล API หลังบ้าน (`/api/*`) ผ่าน Vercel Serverless Function
  - ระบบยืนยันตัวตนและการรักษาความปลอดภัย (Authentication using JWT & Bcrypt)

### 2.2 Cloud Database (ระบบฐานข้อมูล)
* **แพลตฟอร์ม:** **Supabase PostgreSQL**
* **การเชื่อมต่อ:** Prisma ORM v6 ผ่าน Supabase Connection Pooler (`aws-1-ap-northeast-1.pooler.supabase.com:6543`)
* **โครงสร้างตารางข้อมูล (Tables):**
  - `Property`: ข้อมูลบ้าน ตารางวา ตารางเมตร และอัตราค่าส่วนกลาง
  - `Owner`: ข้อมูลเจ้าของบ้าน เบอร์โทรศัพท์ และอีเมล
  - `Invoice`: ข้อมูลบิลค่าส่วนกลาง ยอดเงิน ดอกเบี้ย และสถานะชำระ
  - `Payment`: บันทึกการชำระเงิน เลขที่ใบเสร็จ วันเวลาโอน ลิงก์สลิป
  - `CCTV`: ทะเบียนกล้องวงจรปิด ยี่ห้อ พิกัดบนแผนผัง อาการเสีย และประวัติซ่อมบำรุง
  - `AccountTransaction`: บันทึกบัญชีรายจ่าย-รายรับ (PV/PC/RV) แยกหมวด พร้อมหลักฐานแนบ
  - `PettyCashTopup`: บันทึกรอบการเติมเงินสดย่อยจากกรรมการ (ครั้งละ 5,000 บ.)
  - `PettyCashReplenishment`: บันทึกการสรุปเบิกชดเชยวงเงินสดย่อย
  - `ConstructionDeposit`: ทะเบียนเงินมัดจำต่อเติมบ้าน บันทึกตรวจงาน หักค่าปรับ และคืนเงิน
  - `AccountingSetting`: การตั้งค่าวงเงินสดย่อย เลขที่รันเอกสารถัดไป และลิงก์ Google Drive
  - `PoolWaterQuality`: บันทึกประวัติคุณภาพน้ำสระว่ายน้ำ คลอรีน และ pH
  - `ActivityLog`: บันทึก Audit Log การแก้ไขข้อมูลของผู้ใช้งาน
  - `User`: บัญชีผู้ดูแลระบบ (Admin) และผู้เข้าชม (Viewer)

### 2.3 Cloud Storage & File Handling
* **Supabase Storage (Bucket: `slips`):** จัดเก็บไฟล์สลิปโอนเงิน บิลใบเสร็จ และรูปถ่ายหน้างาน
* **Google Drive Integration (Direct Preview CDN):** รองรับการวางลิงก์ Google Drive โดยระบบจะแปลงเป็น Preview Thumbnail (`https://lh3.googleusercontent.com/d/FILE_ID`) ให้ดูรูปได้ทันทีโดยไม่ต้องตั้งค่า Google Cloud API

### 2.4 Version Control & CI/CD
* **GitHub Repository:** `hoa-management`
* **ระบบเชื่อมโยง:** เชื่อมต่อกับ Vercel อัตโนมัติ (Continuous Deployment) เมื่อ Push โค้ดขึ้น GitHub ระบบจะ Build และ Deploy เว็บจริงให้ทันที

---

## 🎨 3. ไลบรารีและเทคโนโลยีฝั่งหน้าบ้าน (Frontend Tech Stack)

* **Framework:** React 19 + TypeScript + Vite
* **Routing:** React Router DOM v7
* **Icons & UI:** Lucide React Icons
* **Data Visualization:** Recharts (กราฟสถิติงบการเงินและลูกหนี้)
* **Image & Export:** `html2canvas` (สร้างภาพการ์ดสรุปส่ง LINE), `jsPDF` (สร้างเอกสาร PDF ใบเสร็จ/ใบแจ้งหนี้)
* **Notifications:** React Hot Toast

---

## 📂 4. โมดูลการทำงานหลักของระบบ (Main Modules)

1. **Dashboard & สถิติภาพรวม:** แสดงยอดเก็บเงิน อัตราการจ่าย สถิติค้างชำระ และกราฟวิเคราะห์
2. **จัดการข้อมูลลูกบ้าน & แปลงที่ดิน:** ค้นหา กรองสถานะ ชำระเงิน และออกบิล
3. **ระบบใบแจ้งหนี้ & ใบเสร็จรับเงิน (Invoices & Payments):** คำนวณดอกเบี้ย พิมพ์ใบเสร็จรายใบ และพิมพ์ชุด (Batch Print)
4. **ระบบตรวจสลิปโอนเงิน:** ตรวจสอบสลิป ตรวจสอบยอดเงิน และอนุมัติการชำระ
5. **ระบบกล้องวงจรปิด (CCTV) & Interactive Map:** ทะเบียนกล้อง จุดติดตั้ง แผนผังจำลองตำแหน่งกล้อง และประวัติการซ่อม
6. **ระบบตรวจวัดคุณภาพน้ำสระว่ายน้ำ:** บันทึกค่าคลอรีน ค่า pH และกราฟตรวจวัด
7. **ระบบบัญชีและการเงิน (Accounting & Petty Cash):**
   - **รายจ่าย 3 หมวด:** ประจำเดือน (ไฟ/รปภ./ขยะ), ซ่อมแซมปรับปรุง, และวงเงินสดย่อย
   - **วงเงินสดย่อย 5,000 บ.:** บันทึกเติมเงิน สรุปยอดจ่ายย่อย ยกยอดไปสิ้นเดือน
   - **การ์ดสรุปใบสำคัญสดย่อย (Visual Voucher Card):** ถอดแบบรูปบิล + รูปสลิป พร้อมปุ่ม **"คัดลอกรูป"** วางส่ง LINE ได้ในคลิกเดียว
   - **ทะเบียนเงินมัดจำต่อเติมบ้าน:** บันทึกรับมัดจำ ตรวจงาน และคืนเงินมัดจำ
