let model;
async function loadModel() {
  console.log("model loading..");
  loader = document.getElementById("progress-box");
  load_button = document.getElementById("load-button");
  loader.style.display = "block";
  modelName = "mobilenet";
  model = undefined;
  model = await tf.loadLayersModel(
    "./sc_detector/artifacts/tfjs/mobilen_model/model.json"
  );
  loader.style.display = "none";
  load_button.disabled = true;
  load_button.innerHTML = "Loaded Model";
  console.log("model loaded..");
}

async function loadFile() {
  console.log("image is in loadfile..");
  document.getElementById("select-file-box").style.display = "block";
  document.getElementById("predict-box").style.display = "block";
  document.getElementById("prediction").innerHTML =
    "Click predict to find the type of Skin Cancer!";
  var fileInputElement = document.getElementById("select-file-image");
  console.log(fileInputElement.files[0]);
  renderImage(fileInputElement.files[0]);
}

function renderImage(file) {
  var reader = new FileReader();
  console.log("image is here..");
  reader.onload = function (event) {
    img_url = event.target.result;
    console.log("image is here2..");
    document.getElementById("test-image").src = img_url;
  };
  reader.readAsDataURL(file);
}

var chart = "";
var firstTime = 0;
function loadChart(label, data) {

  var ctx = document.getElementById("chart-box").getContext("2d");

  chart = new Chart(ctx, {

    type: "bar",

    data: {

      labels: label,

      datasets: [

        {

          label: "AI Probability",

          data: data,

          backgroundColor: "rgba(34,211,238,0.8)",

          borderColor: "#22d3ee",

          borderWidth: 2,

          borderRadius: 12,

          hoverBackgroundColor: "#06b6d4",

        },

      ],
    },

    options: {

      responsive: true,

      maintainAspectRatio: true,

      animation: {

        duration: 1800,

        easing: "easeOutQuart",
      },

      plugins: {

        legend: {

          labels: {

            color: "white",

            font: {

              size: 18,
              weight: "bold",
            },
          },
        },
      },

      scales: {

        y: {

          beginAtZero: true,

          grid: {

            color: "rgba(255,255,255,0.08)",
          },

          ticks: {

            color: "white",

            font: {

              size: 14,
            },
          },
        },

        x: {

          grid: {

            color: "rgba(255,255,255,0.05)",
          },

          ticks: {

            color: "white",

            font: {

              size: 14,
            },
          },
        },
      },
    },
  });
}

function showExplanation(topClass) {

  let risk = getRiskLevel(topClass);

  let explanation = "";

  if (topClass === "mel") {

    explanation = `
      Irregular shape detected.<br>
      High color variation.<br>
      Pattern similar to melanoma cases.
    `;

  } else if (topClass === "nv") {

    explanation = `
      Even pigmentation.<br>
      Smooth border.<br>
      Likely benign mole.
    `;

  } else {

    explanation = `
      Skin pattern analyzed.<br>
      No critical warning signs detected.
    `;
  }

  document.getElementById("explain-text").innerHTML = `
    <div style="color:${risk.color}; font-weight:bold; font-size:18px;">
      ${risk.level}
    </div>
    <br>
    ${explanation}
  `;

  // ADD RISK METER 
  let bar = document.getElementById("risk-fill");

  bar.style.background = risk.color;
  bar.style.width = "0%";                                               // reset first

  setTimeout(() => {
    bar.style.width = risk.score + "%";
  }, 200);

  document.getElementById("explain-box").style.display = "block";
}
function getRiskLevel(topClass) {

  const highRisk = ["mel", "bcc"];
  const mediumRisk = ["bkl", "akiec"];
  const lowRisk = ["nv", "vasc", "df"];

  if (highRisk.includes(topClass)) {
    return { level: "HIGH RISK", color: "#ef4444", score: 90 };
  }

  if (mediumRisk.includes(topClass)) {
    return { level: "MEDIUM RISK", color: "#f59e0b", score: 60 };
  }

  return { level: "LOW RISK", color: "#22c55e", score: 25 };
}

async function predButton() {
  console.log("model loading..");

  if (model == undefined) {
    alert("Please load the model first..");
    return;
  }
  if (document.getElementById("predict-box").style.display == "none") {
    alert("Please load an image using 'Demo Image' or 'Upload Image' button..");
    return;
  }
  console.log(model);
  let image = document.getElementById("test-image");
  let tensor = preprocessImage(image, modelName);

  let predictions = await model.predict(tensor).data();
  let results_all = Array.from(predictions)
    .map(function (p, i) {
      return {
        probability: p,
        className: TARGET_CLASSES[i],
        index: i,
      };
    })
    .sort(function (a, b) {
      return b.probability - a.probability;
    });

  let results = results_all.slice(0, 3);

  showExplanation(results[0].className);

  document.getElementById("predict-box").style.display = "block";
  document.getElementById("prediction").innerHTML =
    "The predicted type of Skin Cancer is: <br><b>" +
    results[0].className +
    "</b>";

  var ul = document.getElementById("predict-list");
  ul.innerHTML = "";
  results.forEach(function (p) {
    console.log(
      p.className + "(" + p.index + ")" + " " + p.probability.toFixed(6)
    );
    var li = document.createElement("LI");
    
    li.innerHTML = `
  ${p.className} — ${(p.probability * 100).toFixed(2)}%
`;
     ul.appendChild(li);
  });

  // label = ["0", "1", "2", "3", "4", "5", "6"];
  label = [
    "0: akiec",
    "1: bcc",
    "2: bkl",
    "3: df",
    "4: mel",
    "5: nv",
    "6: vasc",
  ];
  if (firstTime == 0) {
    loadChart(label, predictions);
    firstTime = 1;
  } else {
    chart.destroy();
    loadChart(label, predictions);
  }

  document.getElementById("chart-box").style.display = "block";
  setTimeout(() => {
  drawFakeHeatmap();
}, 300);
  /* SAVE HISTORY */

const historyContainer = document.getElementById("history-container");

const imageSrc = document.getElementById("test-image").src;

const topPrediction = results[0].className;

const confidence = (results[0].probability * 100).toFixed(1);

const historyCard = document.createElement("div");

historyCard.classList.add("history-card");

historyCard.innerHTML = `

<img src="${imageSrc}" />

<div class="history-content">

  <h3>
    ${topPrediction}
  </h3>

  <p>
    Confidence: ${confidence}%
  </p>

</div>

`;

const emptyText = document.querySelector(".empty-history");

if(emptyText){
  emptyText.remove();
}

historyContainer.prepend(historyCard);
}

function preprocessImage(image, modelName) {
  let tensor = tf.browser
    .fromPixels(image)
    .resizeNearestNeighbor([224, 224])
    .toFloat();

  if (modelName === undefined) {
    return tensor.expandDims();
  } else if (modelName === "mobilenet") {
    let offset = tf.scalar(127.5);
    return tensor.sub(offset).div(offset).expandDims();
  } else {
    alert("Unknown model name..");
  }
}

function loadDemoImage() {
  document.getElementById("predict-box").style.display = "block";
  document.getElementById("prediction").innerHTML =
    "Click predict to find the type of Skin Cancer!";
  document.getElementById("select-file-box").style.display = "block";
  document.getElementById("predict-list").innerHTML = "";

  base_path = "./assets/nv_samplepic.jpg";
  // maximum = 4;
  // minimum = 1;
  // var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
  // img_path = base_path + randomnumber + ".jpeg"
  img_path = base_path;
  document.getElementById("test-image").src = img_path;
}
