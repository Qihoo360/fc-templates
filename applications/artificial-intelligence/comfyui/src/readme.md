# 应用介绍

本案例是将 comfyui ，快速创建并部署到函数计算 FC 。

ComfyUI 是构建在 Stable Diffusion 之上的基于节点的 GUI ，而 Stable Diffusion 是一种最先进的深度学习模型，可以根据文本描述生成图像。ComfyUI 可以让像你这样的艺术家释放创造力，将你最疯狂的想法变为现实。

通过 Serverless 开发平台，您只需要几步，就可以体验 comfyui  ，并享受 Serverless 架构带来的降本提效的技术红利

* [代码](https://github.com/Qihoo360/fc-templates/tree/feature/fc-app-test/applications/ArtificialIntelligence/comfyui/src)

* [官方网站](https://www.comfy.org/en/)

# 前期准备

使用该项目，您需要有开通以下服务并拥有对应权限：

* 函数计算

# 部署 & 体验

* 通过 智汇云官网 -> 产品列表 -> Serverless开发 ->函数计算 FC，部署该应用。

## 配置依赖

无

# 应用的使用说明

在控制台完成业务功能部署，完成会出现触发器url。
此时，使用浏览器或者 curl 工具， 就可以对触发器url进行请求。

## NAS 设置

由于 comfyu i使用的模型占用的存储空间通常都比较大，不宜和代码一起上传，所以建议使用 NAS 存储模型文件。我们为 comfyui 配置了专门的目录 /mnt/ComfyUI/models，只需将此目录挂载到 NAS 上，就可以将模型文件放在 NAS ，comfyui 会自动去访问这些文件。

![image-20241108141519709](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108141519709.png?raw=true)

![image-20241108142232076](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108142232076.png?raw=true)

使用时，只需将 NAS 根目录对应到 ComfyUI 项目目录下的 models 目录即可，将模型文件上传到对应目录，比如将大模型文件放到 checkpoints 目录、将 loras 放到 loras 目录，在 comfyui 的页面上就可以选择这些模型来使用。

![image-20241108143120897](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108143120897.png?raw=true)

## 使用 ComfyUI 生成“黏土画风”图片

* 下载预置的 json 文件，点击 **Load** 将下载好的 json 文件 导入 ComfyUI。

工作流 json 文件下载：*<https://labfileapp.oss-cn-hangzhou.aliyuncs.com/%E5%87%BD%E6%95%B0%E8%AE%A1%E7%AE%97/%E5%9F%BA%E4%BA%8E%E5%87%BD%E6%95%B0%E8%AE%A1%E7%AE%97%E9%83%A8%E7%BD%B2ComfyUI%E7%BB%98%E7%94%BB%E5%B9%B3%E5%8F%B0/clay%20workflow.zip>*

![image-20241108151013759](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108151013759.png?raw=true)

* 在图片区—Load Image—choose file to upload 导入需要制成“粘土风格”的原图。或者直接将图片拖动到 Load Image 区域。

![image-20241108151153570](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108151153570.png?raw=true)

* 在 Image Resize 区域点击 method 选择其中一种，不能使用默认的 true

![image-20241108151414138](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108151414138.png?raw=true)

* 点击右侧 Queue Prompt 等待图片生成。

![image-20241108151221575](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241108151221575.png?raw=true)

由于目前此项目使用的是CPU而不是GPU，生成图片需要等待大约30-120分钟。生成的图片效果：

![image-20241111110955408](https://github.com/Qihoo360/fc-templates/blob/feature/fc-app-test/applications/artificial-intelligence/comfyui/images/image-20241111110955408.png?raw=true)
