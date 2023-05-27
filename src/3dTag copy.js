import * as THREE from 'three';
/**
 * 添加标签：dom方式
 * @param {*} targePosition ：需要传递当前标签的位置
 * @param {*} targetId ：标签对应的dom的唯一ID，暂且用时间戳代替，避免重复
 * @param {*} innerHTML ：标签对应html
 */
export function labelTag(camera, targePosition, targetId, innerHTML, webGLdom) {
    const { width, height } = webGLdom.getBoundingClientRect();
    let worldVector = new THREE.Vector3(targePosition.x, targePosition.y, targePosition.z);
    let vector = worldVector.project(camera);
    let halfWidth = width / 2,
        halfHeight = height / 2;
    let x = Math.round(vector.x * halfWidth + halfWidth);
    let y = Math.round(-vector.y * halfHeight + halfHeight);
    /**
     * 更新立方体元素位置
     */
    let div = document.getElementById(targetId);
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    // div.innerHTML = `uuid:${innerHTML.uuid}`;
}