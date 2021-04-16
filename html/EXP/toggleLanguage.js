var classList = document.body.getElementsByClassName("lang");

function toggleLanguage(){
  for(var i=0;i<classList.length;i++){
    var temp = classList[i].innerHTML;
    classList[i].innerHTML = classList[i].getAttribute("inner");
    classList[i].setAttribute("inner",temp);
  }
}