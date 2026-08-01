const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf8');
const searchString = `      'ชำระเต็มจำนวน': calcStatus(['ชำระเต็มจำนวน', 'ออกใบเสร็จแล้ว', 'paid', 'ชำระแล้ว']),
    };

        where: { id: invoice.id },`;

const replacementString = `      'ชำระเต็มจำนวน': calcStatus(['ชำระเต็มจำนวน', 'ออกใบเสร็จแล้ว', 'paid', 'ชำระแล้ว']),
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
        where: { id: invoice.id },`;

content = content.replace(searchString, replacementString);
fs.writeFileSync('backend/src/server.ts', content);
