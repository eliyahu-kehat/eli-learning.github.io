const myHeading = document.querySelector("h1");
// alert(myHeading[0].textContent);
// myHeading.forEach(el => el.textContent= "Hello world!");

function click(text) {
    alert("text: " + text);
}
myHeading.addEventListener("click", ()=>click(myHeading[0].textContent));

const myImage = document.querySelector("img");

myImage.onclick = () => {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "images/pika.jfif") {
    myImage.setAttribute("src", "images/raichu.png");
  } else {
    myImage.setAttribute("src", "images/pika.jfif");
  }
};

let myButton = document.querySelector("button");
myButton.onclick=()=>{setUserName()};

if (!localStorage.getItem("name1")) {
  setUserName();
} else {
  const storedName = localStorage.getItem("name");
  myHeading.textContent = `Mozilla is cool, ${storedName}`;
}

function setUserName() {
  const myName = prompt("please enter your name.");
 if(!myName){
  setUserName();
 }
  else{ localStorage.setItem("name1", myName);
  myHeading.textContent=`mozilla is cool, ${myName}`;}
}



// https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics#supercharging_our_example_website
