import logo from "./logo.svg";
import "./App.css";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import MouseFollower from "./components/MouseFollower";
import axios from "axios";
import Placeholder from "./components/Placeholder";
// GlobalWorkerOptions.workerSrc = `/pdf.worker.js`;
const pdfjs = await import("pdfjs-dist/build/pdf.min.mjs");
const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.min.mjs");

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function App() {
  const [imgSrc, setImgSrc] = useState(null);
  const [fileSigned, setFileSigned] = useState(null);
  const pdfcanvas = useRef(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [modePlaceholder, setModePlaceholder] = useState(true);
  const [canvasArea, setCanvasArea] = useState(null);
  const [signPosition, setSignPosition] = useState({
    page: null,
    x: 0,
    y: 0,
  });
  const [placeholderPosition, setPlaceholderPosition] = useState([]);
  const onFileChange = async (event) => {
    const file = event.target.files[0];
    setOriginalFile(file);
    const fileReader = new FileReader();

    fileReader.onload = async function (event) {
      const typedarray = new Uint8Array(event.target.result);
      const pdf = await pdfjs.getDocument(typedarray).promise;
      setPdfFile(pdf);
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    };

    fileReader.readAsArrayBuffer(file);
  };

  const onPageChange = (pageNumber) => {
    setPageNum(pageNumber);
  };

  const handleCanvasClick = (event) => {
    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - 5;
    const y = rect.bottom - event.clientY;
    const yReverse = event.clientY - rect.top;

    const width = process.env.REACT_APP_SIGN_CANVAS_WIDTH;
    const height = process.env.REACT_APP_SIGN_CANVAS_HEIGHT;

    const context = canvas.getContext("2d");

    if (modePlaceholder) {
      // if (placeholderPosition.page == null) {
      context.beginPath();
      context.rect(x, yReverse, width, height);
      context.fillStyle = "rgba(250, 187, 52, 0.38)";
      context.fillRect(x, yReverse, width, height);
      context.strokeStyle = "#FABB34";
      context.lineWidth = 1;
      context.setLineDash([5, 3]);
      context.strokeRect(x, yReverse, width, height);

      // Reset the line dash pattern to solid
      context.setLineDash([]);
      context.fill();
      context.closePath();

      if (!pdfFile) return;
      pdfFile.getPage(pageNum).then(function (page) {
        setPlaceholderPosition((prevState) => [
          ...prevState,
          {
            page: pageNum,
            x: x,
            yReverse: yReverse,
            y: y,
          },
        ]);
      });
      // }
    } else {
      if (signPosition.page == null) {
        const img = new Image();
        img.onload = function () {
          context.beginPath();
          // Draw the image onto the canvas
          context.drawImage(img, x, yReverse, width, height);
          // End the path
          context.closePath();
        };
        img.src = imgSrc;

        if (!pdfFile) return;
        pdfFile.getPage(pageNum).then(function (page) {
          setSignPosition({ page: pageNum, x: x, y: y });
        });
      }
    }
  };

  const handleSign = async (event) => {
    const formData = new FormData();
    formData.append("file", originalFile);
    formData.append("page", signPosition.page);
    formData.append("x", signPosition.x);
    formData.append("y", signPosition.y);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/sign`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.status === 200) {
        alert(response.data.message);
        setFileSigned(response.data.file);
      } else {
        alert("Failed to sign the document");
      }
    } catch (error) {
      alert("Failed to sign the document");
    }
  };

  const clearSign = () => {
    setSignPosition({ page: null, x: 0, y: 0 });
    setPlaceholderPosition({ page: null, x: 0, y: 0, yReverse: 0 });
    const canvas = document.getElementById("pdf-canvas");

    const context = canvas.getContext("2d");

    // Mendapatkan ukuran elemen canvas
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Menghapus seluruh area elemen canvas
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    renderPDF(pageNum, pdfFile);
  };

  const signToPlaceholder = () => {
    const width = process.env.REACT_APP_SIGN_CANVAS_WIDTH;
    const height = process.env.REACT_APP_SIGN_CANVAS_HEIGHT;
    const canvas = document.getElementById("pdf-canvas");
    const context = canvas.getContext("2d");

    // if (signPosition.page == null) {
    const img = new Image();
    img.onload = function () {
      placeholderPosition.forEach((placeholder) => {
        context.beginPath();
        context.drawImage(
          img,
          placeholder.x,
          placeholder.yReverse,
          width,
          height
        );
        context.closePath();
      });
      // context.beginPath();
      // // Draw the image onto the canvas
      // context.drawImage(
      //   img,
      //   placeholderPosition.x,
      //   placeholderPosition.yReverse,
      //   width,
      //   height
      // );
      // // End the path
      // context.closePath();
    };
    img.src = imgSrc;

    if (!pdfFile) return;
    pdfFile.getPage(pageNum).then(function (page) {
      setSignPosition({
        page: pageNum,
        x: placeholderPosition.x,
        y: placeholderPosition.y,
      });
    });
    // }
  };

  const renderPDF = (pageNumber, pdf) => {
    if (!pdf) return;
    pdf.getPage(pageNumber).then((page) => {
      const canvas = document.getElementById("pdf-canvas");

      const context = canvas.getContext("2d");

      const scale = window.innerWidth / page.getViewport({ scale: 1 }).width;

      const viewport = page.getViewport({ scale: 1 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      page.render(renderContext);
      setCanvasArea(canvas.getBoundingClientRect());
    });
  };

  const downloadSigned = async () => {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/download-signed/${fileSigned}`,
      {},
      {
        responseType: "blob",
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileSigned;
    a.click();
  };

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/get-signature-image`,
          { responseType: "blob" }
        );
        const blob = new Blob([response.data], { type: "image/png" });
        const objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      } catch (error) {
        console.error(error);
      }
    };

    fetchImage();
  }, []);

  useEffect(() => {
    renderPDF(pageNum, pdfFile);
  }, [pdfFile, pageNum]);

  const fileInput = useRef();
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100vh",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {pdfFile &&
        canvasArea &&
        signPosition.page == null &&
        !modePlaceholder && (
          <MouseFollower canvasArea={canvasArea} mode={"sign"} />
        )}

      {pdfFile &&
        canvasArea &&
        // placeholderPosition.page == null &&
        modePlaceholder && (
          <Placeholder canvasArea={canvasArea} mode={"placeholder"} />
        )}

      {!pdfFile && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "200px",
            }}
          >
            <input
              type="file"
              ref={fileInput}
              onChange={onFileChange}
              accept=".pdf"
              style={{ display: "none" }} // Hide the default file input
            />
            <button
              onClick={() => fileInput.current.click()}
              style={{
                backgroundColor: "#4CAF50" /* Green */,
                border: "none",
                color: "white",
                padding: "15px 32px",
                textAlign: "center",
                textDecoration: "none",
                display: "inline-block",
                fontSize: "16px",
                margin: "4px 2px",
                cursor: "pointer",
                borderRadius: "12px",
                boxShadow:
                  "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)",
              }}
            >
              Upload PDF
            </button>
          </div>
        </div>
      )}

      {pdfFile && (
        <div style={{ display: "flex", gap: "20px" }}>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* <button
              className="btn-nav"
              onClick={() => setModePlaceholder(true)}
              disabled={modePlaceholder || signPosition.page}
            >
              Mode Placeholder
            </button> */}
            {/* <button
              className="btn-nav"
              onClick={() => setModePlaceholder(false)}
              disabled={
                !modePlaceholder ||
                signPosition.page ||
                placeholderPosition.page
              }
            >
              Mode Sign
            </button> */}
            <button
              className="btn-nav"
              onClick={() => signToPlaceholder()}
              // disabled={placeholderPosition.page == null || signPosition.page}
            >
              Sign To Placeholder
            </button>

            <button className="btn-nav" onClick={() => clearSign()}>
              Reset {modePlaceholder ? "Placeholder" : "Sign"}
            </button>
            <button className="btn-nav" onClick={() => handleSign()}>
              Sign & Submit
            </button>
            <button
              className="btn-nav"
              onClick={() => downloadSigned()}
              disabled={!fileSigned}
            >
              Download Signed
            </button>
          </div>
          <div style={{ background: "#6E6E6E" }}>
            <button
              onClick={() => onPageChange(pageNum - 1)}
              disabled={pageNum <= 1}
            >
              Previous Page
            </button>
            <button
              onClick={() => onPageChange(pageNum + 1)}
              disabled={pageNum >= numPages}
            >
              Next Page
            </button>
            <p style={{ background: "#6E6E6E" }}>
              Page {pageNum} of {numPages}
            </p>
            {/* <div style={{ position: "relative" }}> */}
            <canvas id="pdf-canvas" onClick={handleCanvasClick}></canvas>
            {/* </div> */}

            {/* <canvas id="pdf-canvas" ref={pdfcanvas} onClick={handleCanvasClick}></canvas> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
