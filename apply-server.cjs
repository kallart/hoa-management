const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf8');

const oldServerUpdate = `app.put('/api/properties/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { plot, ownerName, landArea, parkingFee, arrears } = req.body;
  try {
    const updatedLandArea = Number(landArea);
    const updatedParkingFee = Number(parkingFee) || 0;
    const updatedArrears = Number(arrears) || 0;
    const calculatedInterest = updatedArrears * 0.02 * 12;

    const property = await prisma.property.update({
      where: { id },
      data: {
        plot,
        landArea: updatedLandArea,
        ratePerYear: updatedLandArea * 42 * 12,
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
      const newAmount = updatedArrears + calculatedInterest + newCommonFee + updatedParkingFee;
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          commonFee: newCommonFee,
          parkingFee: updatedParkingFee,
          arrears: updatedArrears,
          interest: calculatedInterest,
          amount: newAmount
        }
      });
    }`;

const newServerUpdate = `app.put('/api/properties/:id', requireAdmin, async (req, res) => {
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
    }`;

content = content.replace(oldServerUpdate, newServerUpdate);
fs.writeFileSync('backend/src/server.ts', content);
