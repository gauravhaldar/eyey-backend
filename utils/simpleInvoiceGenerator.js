import PDFDocument from "pdfkit";
import QRCode from "qrcode";

class SimpleInvoiceGenerator {
  static async generateInvoice(order) {
    try {
      // Generate invoice ID if not exists
      if (!order.invoice?.invoiceId) {
        order.invoice = {
          invoiceId: `INV-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)
            .toUpperCase()}`,
          generatedDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentStatus:
            order.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
        };
      }

      // Create QR code data
      const qrData = {
        invoiceId: order.invoice.invoiceId,
        orderId: order.orderId,
        amount: order.orderSummary.total,
        date: order.invoice.generatedDate,
        customer: order.shippingAddress.name,
        email: order.shippingAddress.email,
        status: order.status,
      };

      // Generate QR code
      let qrCodeBuffer;
      try {
        qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
          width: 120,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
      } catch (qrError) {
        console.warn("QR Code generation failed:", qrError.message);
        qrCodeBuffer = null;
      }

      // Create PDF
      const pdfBuffer = await this.createPDF(order, qrCodeBuffer);

      return {
        pdfBuffer,
        invoiceId: order.invoice.invoiceId,
        qrData,
      };
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw new Error("Failed to generate invoice: " + error.message);
    }
  }

  static async createPDF(order, qrCodeBuffer) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: "A4" });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on("error", reject);

        // Helper functions
        const formatCurrency = (amount) => {
          return `₹${parseFloat(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        };

        const formatDate = (date) => {
          return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        };

        // Page dimensions
        const pageWidth = 595.28;
        const margin = 50;
        const contentWidth = pageWidth - margin * 2;
        let yPos = margin;

        // === HEADER ===
        // INVOICE title - large and bold like template
        doc
          .fontSize(36)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("EYEY-OPTICS", margin, yPos);

        // QR Code - top right corner
        if (qrCodeBuffer) {
          doc.image(qrCodeBuffer, pageWidth - margin - 70, yPos, {
            width: 70,
            height: 70,
          });
        }

        yPos += 80;

        // Horizontal line separator
        doc
          .lineWidth(2)
          .strokeColor("#000000")
          .moveTo(margin, yPos)
          .lineTo(pageWidth - margin, yPos)
          .stroke();

        yPos += 30;

        // === BILLED TO & INVOICE INFO SECTION ===
        // Left column - Billed To
        doc
          .fontSize(12)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("BILLED TO:", margin, yPos);

        doc
          .fontSize(14)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text(order.shippingAddress.name.toUpperCase(), margin, yPos + 20);

        let addressY = yPos + 40;
        doc
          .fontSize(11)
          .fillColor("#000000")
          .font("Helvetica")
          .text(order.shippingAddress.addressLine1, margin, addressY);

        if (order.shippingAddress.addressLine2) {
          addressY += 15;
          doc.text(order.shippingAddress.addressLine2, margin, addressY);
        }

        addressY += 15;
        doc.text(
          `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
          margin,
          addressY
        );

        // Right column - Invoice Info
        const infoX = pageWidth - margin - 200;
        doc
          .fontSize(11)
          .fillColor("#000000")
          .font("Helvetica")
          .text("INVOICE NO.", infoX, yPos)
          .font("Helvetica-Bold")
          .text(order.invoice.invoiceId, infoX, yPos + 15);

        doc
          .font("Helvetica")
          .text(formatDate(order.invoice.generatedDate), infoX, yPos + 35);

        yPos += 100;

        // Another separator line
        doc
          .lineWidth(1)
          .strokeColor("#000000")
          .moveTo(margin, yPos)
          .lineTo(pageWidth - margin, yPos)
          .stroke();

        yPos += 30;

        // === ITEMS TABLE (Clean minimal style) ===
        // Table headers
        const colDescX = margin;
        const colQtyX = margin + 280;
        const colPriceX = margin + 340;
        const colTotalX = margin + 420;

        doc
          .fontSize(11)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("DESCRIPTION", colDescX, yPos)
          .text("QTY", colQtyX, yPos)
          .text("PRICE", colPriceX, yPos)
          .text("TOTAL", colTotalX, yPos);

        yPos += 25;

        // Header underline
        doc
          .lineWidth(1)
          .strokeColor("#000000")
          .moveTo(margin, yPos)
          .lineTo(pageWidth - margin, yPos)
          .stroke();

        yPos += 20;

        // Items
        order.items.forEach((item, index) => {
          const itemTotal = item.price * item.quantity;

          // Product name
          doc
            .fontSize(11)
            .fillColor("#000000")
            .font("Helvetica")
            .text(item.name, colDescX, yPos);

          // Product details on next line if available
          if (item.category || item.size || item.color) {
            const details = [item.category, item.size, item.color]
              .filter(Boolean)
              .join(" • ");
            doc
              .fontSize(9)
              .fillColor("#666666")
              .text(details, colDescX, yPos + 15);
            yPos += 15;
          }

          // Quantity, Price, Total
          doc
            .fontSize(11)
            .fillColor("#000000")
            .font("Helvetica")
            .text(item.quantity.toString(), colQtyX, yPos)
            .text(formatCurrency(item.price), colPriceX, yPos)
            .text(formatCurrency(itemTotal), colTotalX, yPos);

          yPos += 35;
        });

        yPos += 20;

        // === TOTALS SECTION (Right aligned like template) ===
        const totalsX = pageWidth - margin - 150;

        // Subtotal
        doc
          .fontSize(11)
          .fillColor("#000000")
          .font("Helvetica")
          .text("SUB TOTAL", totalsX - 100, yPos)
          .text(formatCurrency(order.orderSummary.subtotal), totalsX, yPos);

        yPos += 20;

        // Shipping
        if (order.orderSummary.shippingCharge > 0) {
          doc
            .text("SHIPPING", totalsX - 100, yPos)
            .text(
              formatCurrency(order.orderSummary.shippingCharge),
              totalsX,
              yPos
            );
          yPos += 20;
        }

        // Discount
        if (order.orderSummary.couponDiscount > 0) {
          doc
            .text("DISCOUNT", totalsX - 100, yPos)
            .text(
              `-${formatCurrency(order.orderSummary.couponDiscount)}`,
              totalsX,
              yPos
            );
          yPos += 20;
        }

        // Tax
        doc
          .text("TAX (18%)", totalsX - 100, yPos)
          .text(formatCurrency(order.orderSummary.tax), totalsX, yPos);

        yPos += 30;

        // Total line separator
        doc
          .lineWidth(1)
          .strokeColor("#000000")
          .moveTo(totalsX - 100, yPos)
          .lineTo(pageWidth - margin, yPos)
          .stroke();

        yPos += 15;

        // Grand Total
        doc
          .fontSize(14)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("GRAND TOTAL", totalsX - 100, yPos)
          .text(formatCurrency(order.orderSummary.total), totalsX, yPos);

        yPos += 60;

        // === BOTTOM SECTION ===
        // Amount in words
        const totalInWords = this.numberToWords(
          Math.round(order.orderSummary.total)
        );

        doc
          .fontSize(10)
          .fillColor("#666666")
          .font("Helvetica")
          .text("Amount in Words:", margin, yPos)
          .fontSize(11)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text(`${totalInWords} Rupees Only`, margin, yPos + 15);

        yPos += 50;

        // Payment Info Section (Left side)
        doc
          .fontSize(12)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("PAYMENT INFO", margin, yPos);

        yPos += 20;

        doc
          .fontSize(10)
          .fillColor("#000000")
          .font("Helvetica")
          .text("EyeyOptics Pvt. Ltd.", margin, yPos)
          .text("HDFC Bank, Main Branch", margin, yPos + 15)
          .text(
            `Payment Method: ${order.paymentMethod
              .replace("_", " ")
              .toUpperCase()}`,
            margin,
            yPos + 30
          )
          .text(
            `Status: ${order.invoice.paymentStatus.toUpperCase()}`,
            margin,
            yPos + 45
          );

        // Thank you section (Right side)
        const thankYouX = pageWidth - margin - 180;
        doc
          .fontSize(16)
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .text("THANK YOU FOR", thankYouX, yPos)
          .text("YOUR BUSINESS", thankYouX, yPos + 20);

        yPos += 80;

        // Company details footer
        doc
          .fontSize(9)
          .fillColor("#666666")
          .font("Helvetica")
          .text(
            "EyeyOptics Pvt. Ltd. | 123 Vision Street, Optical Plaza, Mumbai, Maharashtra - 400001",
            margin,
            yPos
          )
          .text(
            "GSTIN: 29ABCDE1234F1Z5 | PAN: ABCDE1234F | Phone: +91 9876543210",
            margin,
            yPos + 12
          )
          .text(
            `Generated on ${formatDate(new Date())} | Invoice System v4.0`,
            margin,
            yPos + 24
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static numberToWords(num) {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (num === 0) return "Zero";

    function convertHundreds(n) {
      let result = "";
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " Hundred ";
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        result += ones[n % 10] + " ";
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
      } else if (n > 0) {
        result += ones[n] + " ";
      }
      return result;
    }

    let result = "";
    if (num >= 10000000) {
      result += convertHundreds(Math.floor(num / 10000000)) + "Crore ";
      num %= 10000000;
    }
    if (num >= 100000) {
      result += convertHundreds(Math.floor(num / 100000)) + "Lakh ";
      num %= 100000;
    }
    if (num >= 1000) {
      result += convertHundreds(Math.floor(num / 1000)) + "Thousand ";
      num %= 1000;
    }
    if (num > 0) {
      result += convertHundreds(num);
    }

    return result.trim();
  }
}

export default SimpleInvoiceGenerator;
