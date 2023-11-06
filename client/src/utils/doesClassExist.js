function doesClassExist(className, stylesheets) {
  for (let stylesheet of stylesheets) {
    //Required to make this work with Jest/identity-obj-proxy
    if (typeof stylesheet === 'object') {
      if (stylesheet[className]) {
        return true;
      }
    } else if (typeof stylesheet === 'string') {
      if (
        //Required to fix issue with dev and prod defaulting to icon-applications for every icon
        stylesheet.includes(`.${className}::before`) ||
        stylesheet.includes(`.${className}:before`)
      ) {
        return true;
      }
    }
  }
  return false;
}
export default doesClassExist;
