import htmlPdf from "html-pdf-node";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

class InvoiceGenerator {
  static async generateInvoice(order) {
    try {
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

      const qrData = {
        invoiceId: order.invoice.invoiceId,
        orderId: order.orderId,
        amount: order.orderSummary.total,
        date: order.invoice.generatedDate,
        customer: order.shippingAddress.name,
        email: order.shippingAddress.email,
        status: order.status,
      };

      let qrCodeDataURL;
      try {
        qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
      } catch (qrError) {
        console.warn(
          "QR Code generation failed, using fallback:",
          qrError.message
        );
        qrCodeDataURL =
          "data:image/svg+xml;base64," +
          Buffer.from(
            `
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f3f4f6"/>
            <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#374151">
              QR Code: ${order.invoice.invoiceId}
            </text>
          </svg>
        `
          ).toString("base64");
      }

      const htmlContent = this.generateHTMLTemplate(order, qrCodeDataURL);

      const options = {
        format: "A4",
        printBackground: true,
        margin: {
          top: "0.5in",
          bottom: "0.5in",
          left: "0.5in",
          right: "0.5in",
        },
        timeout: 30000,
      };

      const file = { content: htmlContent };
      let pdfBuffer;

      try {
        pdfBuffer = await htmlPdf.generatePdf(file, options);
      } catch (pdfError) {
        console.error("PDF generation failed:", pdfError.message);
        throw new Error("PDF generation failed. Please try again.");
      }

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

  static generateHTMLTemplate(order, qrCodeDataURL) {
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Tax Invoice - ${order.invoice.invoiceId}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                line-height: 1.5;
                color: #1a1a1a;
                background: #fff;
                -webkit-font-smoothing: antialiased;
            }
            
            .invoice-wrapper {
                max-width: 800px;
                margin: 0 auto;
                background: #fff;
                position: relative;
            }
            
            .header-section {
                border-bottom: 3px solid #000;
                padding: 40px 0;
                position: relative;
            }
            
            .qr-code {
                position: absolute;
                top: 20px;
                right: 0;
                width: 80px;
                height: 80px;
                border: 2px solid #000;
                padding: 5px;
                background: #fff;
            }
            
            .qr-code img {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            .company-header {
                max-width: 60%;
            }
            
            .company-name {
                font-size: 42px;
                font-weight: 900;
                color: #000;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 8px;
                line-height: 0.9;
            }
            
            .company-tagline {
                font-size: 14px;
                color: #555;
                font-weight: 500;
                margin-bottom: 25px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .company-details {
                font-size: 12px;
                line-height: 1.6;
                color: #333;
            }
            
            .company-details strong {
                color: #000;
            }
            
            .invoice-title {
                position: absolute;
                top: 40px;
                right: 100px;
                font-size: 24px;
                font-weight: 700;
                color: #000;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .invoice-meta {
                position: absolute;
                top: 70px;
                right: 100px;
                text-align: right;
                font-size: 12px;
                line-height: 1.6;
            }
            
            .addresses-row {
                display: flex;
                padding: 30px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .address-col {
                flex: 1;
                padding-right: 40px;
            }
            
            .address-col:last-child {
                padding-right: 0;
            }
            
            .address-title {
                font-size: 11px;
                font-weight: 700;
                color: #666;
                text-transform: uppercase;
                margin-bottom: 15px;
                letter-spacing: 1px;
            }
            
            .customer-name {
                font-size: 16px;
                font-weight: 700;
                color: #000;
                margin-bottom: 10px;
            }
            
            .address-text {
                font-size: 13px;
                line-height: 1.6;
                color: #333;
            }
            
            .items-section {
                padding: 30px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .section-title {
                font-size: 14px;
                font-weight: 700;
                color: #000;
                text-transform: uppercase;
                margin-bottom: 20px;
                letter-spacing: 1px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .items-table th {
                background: #000;
                color: #fff;
                padding: 15px 12px;
                text-align: left;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 0.5px;
            }
            
            .items-table td {
                padding: 18px 12px;
                border-bottom: 1px solid #eee;
                vertical-align: top;
                font-size: 13px;
            }
            
            .items-table .text-center {
                text-align: center;
            }
            
            .items-table .text-right {
                text-align: right;
            }
            
            .product-name {
                font-weight: 600;
                color: #000;
                margin-bottom: 6px;
                font-size: 14px;
            }
            
            .product-desc {
                font-size: 11px;
                color: #666;
                line-height: 1.4;
            }
            
            .summary-section {
                display: flex;
                padding: 30px 0;
            }
            
            .summary-left {
                flex: 1;
                padding-right: 40px;
            }
            
            .amount-words {
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 20px;
            }
            
            .amount-words-title {
                font-size: 11px;
                font-weight: 700;
                color: #666;
                text-transform: uppercase;
                margin-bottom: 10px;
                letter-spacing: 1px;
            }
            
            .amount-words-text {
                font-size: 13px;
                font-weight: 600;
                color: #000;
                line-height: 1.4;
            }
            
            .summary-right {
                flex: 0 0 280px;
            }
            
            .summary-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #ddd;
            }
            
            .summary-table td {
                padding: 12px 15px;
                border-bottom: 1px solid #eee;
                font-size: 13px;
            }
            
            .summary-table .label {
                color: #333;
                font-weight: 500;
                text-align: left;
            }
            
            .summary-table .value {
                text-align: right;
                font-weight: 600;
                color: #000;
            }
            
            .summary-table .total-row {
                background: #000;
                color: #fff;
                font-weight: 700;
                font-size: 15px;
            }
            
            .summary-table .total-row td {
                border-bottom: none;
                padding: 15px;
            }
            
            .footer-section {
                padding: 30px 0;
                border-top: 1px solid #ddd;
            }
            
            .footer-grid {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
            }
            
            .payment-info {
                flex: 1;
                padding-right: 40px;
            }
            
            .terms-info {
                flex: 1;
            }
            
            .footer-title {
                font-size: 12px;
                font-weight: 700;
                color: #000;
                text-transform: uppercase;
                margin-bottom: 15px;
                letter-spacing: 1px;
            }
            
            .payment-details {
                font-size: 12px;
                line-height: 1.6;
                color: #333;
            }
            
            .terms-list {
                list-style: none;
                padding: 0;
                font-size: 11px;
                line-height: 1.6;
                color: #333;
            }
            
            .terms-list li {
                margin-bottom: 6px;
                position: relative;
                padding-left: 15px;
            }
            
            .terms-list li:before {
                content: "•";
                position: absolute;
                left: 0;
                color: #000;
                font-weight: 700;
            }
            
            .footer-note {
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 12px;
                color: #666;
            }
            
            .footer-note .highlight {
                font-weight: 700;
                color: #000;
                margin-bottom: 5px;
            }
            
            .col-sno { width: 6%; }
            .col-product { width: 44%; }
            .col-qty { width: 8%; }
            .col-price { width: 14%; }
            .col-total { width: 14%; }
            .col-tax { width: 14%; }
            
            @media print {
                .invoice-wrapper {
                    max-width: none;
                }
                body {
                    background: white;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <!-- Header -->
            <div class="header-section">
                <div class="qr-code">
                    <img src="${qrCodeDataURL}" alt="QR Code">
                </div>
                
                <div class="company-header">
                    <h1 class="company-name">EyeyOptics</h1>
                    <div class="company-tagline">Premium Eyewear Solutions</div>
                    <div class="company-details">
                        <strong>EyeyOptics Pvt. Ltd.</strong><br>
                        123 Vision Street, Optical Plaza<br>
                        Mumbai, Maharashtra - 400001<br>
                        <strong>GSTIN:</strong> 29ABCDE1234F1Z5 | <strong>PAN:</strong> ABCDE1234F<br>
                        <strong>Phone:</strong> +91 9876543210
                    </div>
                </div>
                
                <div class="invoice-title">TAX INVOICE</div>
                <div class="invoice-meta">
                    <strong>Invoice:</strong> ${order.invoice.invoiceId}<br>
                    <strong>Date:</strong> ${formatDate(
                      order.invoice.generatedDate
                    )}<br>
                    <strong>Order:</strong> ${order.orderId}
                </div>
            </div>
            
            <!-- Addresses -->
            <div class="addresses-row">
                <div class="address-col">
                    <div class="address-title">Bill To</div>
                    <div class="customer-name">${
                      order.shippingAddress.name
                    }</div>
                    <div class="address-text">
                        ${order.shippingAddress.addressLine1}<br>
                        ${
                          order.shippingAddress.addressLine2
                            ? order.shippingAddress.addressLine2 + "<br>"
                            : ""
                        }
                        ${order.shippingAddress.city}, ${
      order.shippingAddress.state
    } ${order.shippingAddress.zipCode}<br>
                        Phone: ${order.shippingAddress.phone}<br>
                        Email: ${order.shippingAddress.email}
                    </div>
                </div>
                
                <div class="address-col">
                    <div class="address-title">Ship To</div>
                    <div class="customer-name">${
                      order.shippingAddress.name
                    }</div>
                    <div class="address-text">
                        ${order.shippingAddress.addressLine1}<br>
                        ${
                          order.shippingAddress.addressLine2
                            ? order.shippingAddress.addressLine2 + "<br>"
                            : ""
                        }
                        ${order.shippingAddress.city}, ${
      order.shippingAddress.state
    } ${order.shippingAddress.zipCode}<br>
                        Phone: ${order.shippingAddress.phone}
                    </div>
                </div>
            </div>
            
            <!-- Items -->
            <div class="items-section">
                <div class="section-title">Order Details</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th class="col-sno text-center">#</th>
                            <th class="col-product">Product</th>
                            <th class="col-qty text-center">Qty</th>
                            <th class="col-price text-right">Price</th>
                            <th class="col-tax text-right">Tax</th>
                            <th class="col-total text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                          .map((item, index) => {
                            const itemTax = item.price * item.quantity * 0.18;
                            const itemTotal =
                              item.price * item.quantity + itemTax;

                            return `
                            <tr>
                                <td class="text-center">${index + 1}</td>
                                <td>
                                    <div class="product-name">${item.name}</div>
                                    <div class="product-desc">
                                        ${[
                                          item.category || "Eyeglasses",
                                          item.color
                                            ? `Color: ${item.color}`
                                            : "",
                                          item.size ? `Size: ${item.size}` : "",
                                        ]
                                          .filter(Boolean)
                                          .join(" • ")}
                                    </div>
                                </td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${formatCurrency(
                                  item.price
                                )}</td>
                                <td class="text-right">${formatCurrency(
                                  itemTax
                                )}</td>
                                <td class="text-right"><strong>${formatCurrency(
                                  itemTotal
                                )}</strong></td>
                            </tr>
                            `;
                          })
                          .join("")}
                    </tbody>
                </table>
            </div>
            
            <!-- Summary -->
            <div class="summary-section">
                <div class="summary-left">
                    <div class="amount-words">
                        <div class="amount-words-title">Amount in Words</div>
                        <div class="amount-words-text">${this.convertToWords(
                          order.orderSummary.total
                        )}</div>
                    </div>
                </div>
                
                <div class="summary-right">
                    <table class="summary-table">
                        <tr>
                            <td class="label">Subtotal</td>
                            <td class="value">${formatCurrency(
                              order.orderSummary.subtotal
                            )}</td>
                        </tr>
                        <tr>
                            <td class="label">Shipping</td>
                            <td class="value">${formatCurrency(
                              order.orderSummary.shippingCharge
                            )}</td>
                        </tr>
                        ${
                          order.orderSummary.couponDiscount > 0
                            ? `
                        <tr>
                            <td class="label">Discount</td>
                            <td class="value">-${formatCurrency(
                              order.orderSummary.couponDiscount
                            )}</td>
                        </tr>
                        `
                            : ""
                        }
                        <tr>
                            <td class="label">Tax (18%)</td>
                            <td class="value">${formatCurrency(
                              order.orderSummary.tax
                            )}</td>
                        </tr>
                        <tr class="total-row">
                            <td class="label">Total Amount</td>
                            <td class="value">${formatCurrency(
                              order.orderSummary.total
                            )}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer-section">
                <div class="footer-grid">
                    <div class="payment-info">
                        <div class="footer-title">Payment Information</div>
                        <div class="payment-details">
                            <strong>Method:</strong> ${order.paymentMethod
                              .replace("_", " ")
                              .toUpperCase()}<br>
                            <strong>Status:</strong> ${order.invoice.paymentStatus.toUpperCase()}<br>
                            <strong>Due Date:</strong> ${formatDate(
                              order.invoice.dueDate
                            )}
                        </div>
                    </div>
                    
                    <div class="terms-info">
                        <div class="footer-title">Terms & Conditions</div>
                        <ul class="terms-list">
                            <li>Computer generated invoice, no signature required</li>
                            <li>All disputes subject to Mumbai jurisdiction</li>
                            <li>Goods once sold are non-returnable except defects</li>
                            <li>Payment due within 30 days from invoice date</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-note">
                    <div class="highlight">Thank you for choosing EyeyOptics!</div>
                    <div>Generated on ${formatDate(
                      new Date()
                    )} • Invoice System v4.0</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  static convertToWords(amount) {
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

    function convertHundreds(num) {
      let result = "";
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
      }
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      } else if (num >= 10) {
        result += teens[num - 10] + " ";
        return result;
      }
      if (num > 0) {
        result += ones[num] + " ";
      }
      return result;
    }

    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);
    let result = "";

    if (dollars >= 1000000) {
      result += convertHundreds(Math.floor(dollars / 1000000)) + "Million ";
      dollars %= 1000000;
    }

    if (dollars >= 1000) {
      result += convertHundreds(Math.floor(dollars / 1000)) + "Thousand ";
      dollars %= 1000;
    }

    if (dollars > 0) {
      result += convertHundreds(dollars);
    }

    result += "Dollars";

    if (cents > 0) {
      result += " and " + convertHundreds(cents) + "Cents";
    }

    result += " Only";

    return result.trim();
  }
}

export default InvoiceGenerator;
