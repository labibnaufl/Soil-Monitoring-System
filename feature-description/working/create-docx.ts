import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  Packer,
  PageBreak,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const inputFile = "feature-description/output/feature_description.md";
const outputFile = "feature-description/output/feature_description.docx";
const imagesDir = "feature-description/output/images";

const markdown = fs.readFileSync(inputFile, "utf-8");
const lines = markdown.split(/\r?\n/);

const children: Paragraph[] = [];

function addHeading(text: string, level: number) {
  const headingLevel =
    level === 1
      ? HeadingLevel.HEADING_1
      : level === 2
      ? HeadingLevel.HEADING_2
      : HeadingLevel.HEADING_3;
  children.push(
    new Paragraph({
      text,
      heading: headingLevel,
      spacing: { before: 240, after: 120 },
    })
  );
}

function addParagraph(text: string) {
  // Replace markdown italic *word* with italic runs
  const parts = text.split(/(\*[^*]+\*)/g);
  const runs: TextRun[] = [];
  for (const part of parts) {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          italics: true,
        })
      );
    } else if (part.length > 0) {
      runs.push(new TextRun(part));
    }
  }
  children.push(
    new Paragraph({
      children: runs,
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120 },
    })
  );
}

function addImage(imagePath: string) {
  const ext = path.extname(imagePath).toLowerCase();
  const type = ext === ".png" ? "png" : ext === ".jpg" || ext === ".jpeg" ? "jpg" : "png";
  const buffer = fs.readFileSync(imagePath);
  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: buffer,
          transformation: { width: 550, height: 344 },
          type,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
    })
  );
}

function addCaption(text: string) {
  children.push(
    new Paragraph({
      text,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    })
  );
}

let i = 0;
while (i < lines.length) {
  const line = lines[i].trim();

  if (line === "") {
    i++;
    continue;
  }

  // Heading 2: ## 2.2.1 Web Application
  if (line.startsWith("## ")) {
    addHeading(line.replace("## ", ""), 2);
    i++;
    continue;
  }

  // Heading 3: ### A. Halaman Login
  if (line.startsWith("### ")) {
    addHeading(line.replace("### ", ""), 3);
    i++;
    continue;
  }

  // Image: ![alt](images/...)
  const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imageMatch) {
    const imagePath = path.join(imagesDir, path.basename(imageMatch[2]));
    if (fs.existsSync(imagePath)) {
      addImage(imagePath);
    }
    i++;
    continue;
  }

  // Caption: <p align="center">Gambar X.Y. ...</p>
  const captionMatch = line.match(/<p align="center">(.+?)<\/p>/);
  if (captionMatch) {
    addCaption(captionMatch[1]);
    i++;
    continue;
  }

  // Regular paragraph
  addParagraph(line);
  i++;
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputFile, buffer);
  console.log(`DOCX created: ${outputFile}`);
});
