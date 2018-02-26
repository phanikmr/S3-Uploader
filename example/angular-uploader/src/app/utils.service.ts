export class Utilities {

  public static removeDuplicateFiles(arr: File[]) {
    let output;
    output = new Array();
    let count = 0;
    let found = false;
    for (let i = 0; i < arr.length; i++) {
        found = false;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i].name === arr[j].name) {
                found = true;
                count++;
            }
        }
        if (!found) {
            output.push(arr[i]);
        }
    }
    if (count > 0) {
        // AIM.Noty.Warning(count + " duplicate file(s) is/are ignored");
    }
    return output;
  }

  public static generateUUID(): string {
    let d = new Date().getTime();
    if (window.performance && typeof window.performance.now === 'function') {
      d += performance.now();
    }
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }
}
