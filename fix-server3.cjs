const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf8');

const oldStr = `    const calcStatus = (statuses: string[]) => {
      const filtered = invoices.filter(i => statuses.includes(i.status));
      return {
        count: filtered.length,
        amount: filtered.reduce((sum, i) => sum + i.amount, 0)
      };
    };

          interest: calculatedInterest,
          amount: newAmount
        }
      });
    }

    await addLog('แก้ไขข้อมูลบ้าน', \`อัปเดตข้อมูลและลดยอด/เพิ่มยอดสำหรับบ้านเลขที่ \${property.houseNumber}\`, property.houseNumber);

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});`;

const newStr = `    const calcStatus = (statuses: string[]) => {
      const filtered = invoices.filter(i => statuses.includes(i.status));
      return {
        count: filtered.length,
        amount: filtered.reduce((sum, i) => sum + i.amount, 0)
      };
    };

    const statusCounts = {
      'รอแจ้งค่าส่วนกลาง': calcStatus(['รอแจ้งค่าส่วนกลาง', 'unpaid']),
      'รอการชำระ': calcStatus(['รอการชำระ', 'overdue']),
      'ชำระบางส่วน': calcStatus(['ชำระบางส่วน']),
      'รอตรวจสอบยอดเงิน': calcStatus(['รอตรวจสอบยอดเงิน', 'partial']),
      'ชำระเต็มจำนวน': calcStatus(['ชำระเต็มจำนวน', 'ออกใบเสร็จแล้ว', 'paid', 'ชำระแล้ว']),
    };

    res.json({
      totalHouses,
      collectionRate,
      housesWithParking,
      totalCollected,
      totalOutstanding,
      monthlyData,
      statusCounts
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: { 
        owner: true,
        invoices: true 
      }
    });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.put('/api/properties/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { plot, ownerName, landArea, parkingFee, arrears, chargeInterest } = req.body;
  try {
    const updatedLandArea = Number(landArea);
    const updatedParkingFee = Number(parkingFee) || 0;
    const updatedArrears = Number(arrears) || 0;
    const calculatedInterest = updatedArrears * 0.02 * 12;
    const isInterestWaived = chargeInterest === false;

    const property = await prisma.property.update({
      where: { id },
      data: {
        plot,
        landArea: updatedLandArea,
        ratePerYear: updatedLandArea * 42 * 12,
        chargeInterest: chargeInterest !== undefined ? chargeInterest : true,
        owner: {
          upsert: {
            create: { name: ownerName },
            update: { name: ownerName }
          }
        }
      },
      include: { invoices: true, owner: true }
    });

    if (property.invoices && property.invoices.length > 0) {
      const invoice = property.invoices[0];
      const newCommonFee = updatedLandArea * 42 * 12;
      const appliedInterest = isInterestWaived ? 0 : calculatedInterest;
      const newAmount = updatedArrears + appliedInterest + newCommonFee + updatedParkingFee;
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          commonFee: newCommonFee,
          parkingFee: updatedParkingFee,
          arrears: updatedArrears,
          interest: calculatedInterest,
          isInterestWaived: isInterestWaived,
          amount: newAmount
        }
      });
    }

    await addLog('แก้ไขข้อมูลบ้าน', \`อัปเดตข้อมูลและลดยอด/เพิ่มยอดสำหรับบ้านเลขที่ \${property.houseNumber}\`, property.houseNumber);

    res.json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('backend/src/server.ts', content);
