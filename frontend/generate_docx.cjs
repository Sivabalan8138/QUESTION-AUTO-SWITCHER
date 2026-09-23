const docx = require('docx');
const fs = require('fs');

const doc = new docx.Document({
    sections: [{
        properties: {},
        children: [
            new docx.Table({
                rows: [
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({ children: [new docx.Paragraph("S.NO")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("Emoj")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("Time")] }),
                        ]
                    }),
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({ children: [new docx.Paragraph("1")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("🧠 + 🌧️")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("20 Sec")] }),
                        ]
                    }),
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({ children: [new docx.Paragraph("2")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("⛰️ 🚂 🌲 🥶")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("20 Sec")] }),
                        ]
                    }),
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({ children: [new docx.Paragraph("3")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("🐂 🏃 🚩 🌾")] }),
                            new docx.TableCell({ children: [new docx.Paragraph("20 Sec")] }),
                        ]
                    })
                ]
            })
        ]
    }]
});

docx.Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("public/word_template.docx", buffer);
    console.log("Template created at public/word_template.docx");
});
