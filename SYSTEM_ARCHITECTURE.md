# 🏗️ สถาปัตยกรรมระบบและโครงสร้างเทคโนโลยี (System Architecture & Tech Stack)
**โครงการ:** ระบบจัดการนิติบุคคลหมู่บ้าน (HOA Management)  
**อัปเดตล่าสุด:** 4 ตุลาคม 2026  

---

## 📌 1. ภาพรวมสถาปัตยกรรมระบบ (System Overview)

ระบบ HOA Management เป็นเว็บแอปพลิเคชันรูปแบบ **Single Page Application (SPA)** แบบคลาวด์เนทีฟ ทำงานผ่านสถาปัตยกรรม **Serverless** ร่วมกับ **Cloud Database & Cloud Storage** เพื่อรองรับการเข้าใช้งานพร้อมกันจากทุกอุปกรณ์ (คอมพิวเตอร์, แท็บเล็ต, สมาร์ทโฟน) โดยไม่ต้องเปิดเซิร์ฟเวอร์ส่วนบุคคลไว้ที่บ้าน

```
[ ผู้ใช้งาน (Web Browser / Mobile) ]
                │
                ▼
  ┌──────────────────────────┐
  │   Vercel Cloud Platform  │
  ├──────────────────────────┤
  │ 1. Frontend (React 19)   │
  │ 2. Backend API           │
  │    (Serverless Express)  │
  └─────────────┬────────────┘
                │
        ┌───────┴───────┐
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│  Supabase    │ │  Supabase    │
│  PostgreSQL  │ │  Storage     │
│  (Database)  │ │  (Slip Img)  │
└──────────────┘ └──────────────┘
```

---

## 🛠️ 2. รายละเอียดแพลตฟอร์มและเทคโนโลยีที่ใช้ (Tech Stack Details)

### 2.1 Web Hosting & Serverless Backend
* **แพลตฟอร์ม:** **Vercel** (`https://hoa-management-vert.vercel.app/`)
* **หน้าที่:**
  - โฮสต์และให้บริการหน้าเว็บอินเทอร์เฟซแก่ผู้ใช้งานแบบ 24/7
  - ประมวลผลคำสั่ง API หลังบ้าน (`/api/*`) ผ่าน Vercel Serverless Functions
  - จัดการระบบความปลอดภัยและการยืนยันตัวตน (Authentication using JWT & Bcrypt)

### 2.2 Cloud Database (ระบบฐานข้อมูล)
* **แพลตฟอร์ม:** **Supabase PostgreSQL** (`https://supabase.com`)
* **การเชื่อมต่อ:** Prisma ORM v6.19.3 ผ่าน Connection Pooler (`aws-1-ap-northeast-1.pooler.supabase.com:6543`)
* **โครงสร้างตารางหลัก (Tables):**
  - `Property`: ข้อมูลบ้าน ตารางเมตร อัตราค่าส่วนกลางรายปี
  - `Owner`: ข้อมูลเจ้าของบ้าน เบอร์โทรศัพท์ และอีเมล
  - `Invoice`: บิลค่าส่วนกลาง ยอดชำระ ดอกเบี้ย และสถานะการชำระเงิน
  - `Payment`: รายการรับชำระเงิน เลขที่ใบเสร็จ วันเวลาโอน และลิงก์สลิป
  - `ActivityLog`: ประวัติบันทึกการทำงานของผู้ใช้งานบนหน้าเว็บ
  - `PoolWaterQuality`: บันทึกประวัติคุณภาพน้ำสระว่ายน้ำ ค่าคลอรีน และค่า pH
  - `User`: บัญชีผู้ดูแลระบบ (Admin) และผู้เข้าชม (Viewer)

### 2.3 Cloud Storage (ระบบจัดเก็บไฟล์รูปภาพ)
* **แพลตฟอร์ม:** **Supabase Storage** (Bucket: `slips`)
* **หน้าที่:**
  - จัดเก็บไฟล์สลิปการโอนเงินที่อัปโหลดโดยผู้ใช้งาน
  - สร้าง Public URL สำหรับนำไปแสดงผลบนหน้าเว็บและพิมพ์ใบเสร็จรับเงิน

### 2.4 Version Control & Continuous Deployment
* **แพลตฟอร์ม:** **GitHub** (Repository: `hoa-management`)
* **หน้าที่:**
  - จัดเก็บซอร์สโค้ดและประวัติการพัฒนาโปรแกรมอย่างปลอดภัย
  - เชื่อมต่อกับ Vercel แบบอัตโนมัติ (CI/CD) เมื่อมีโค้ดใหม่ pushed ขึ้น GitHub ระบบ Vercel จะทำการอัปเดตเว็บให้อัตโนมัติทันที

---

## 🎨 3. เทคโนโลยีและไลบรารีฝั่งหน้าบ้าน (Frontend Tech Stack)

* **Core Framework:** React 19 + TypeScript + Vite (สร้างหน้าเว็บความเร็วสูง)
* **Routing:** React Router DOM v7
* **Icons & UI:** Lucide React Icons
* **Data Visualization:** Recharts (กราฟสถิติต่างๆ ในหน้า Dashboard)
* **Document Generation:** `jsPDF` + `HTML2Canvas` (ระบบพิมพ์ใบเสร็จและใบแจ้งหนี้แบบพิมพ์ทีละใบและแบบพิมพ์ชุด Batch Print)
* **Notifications:** React Hot Toast
