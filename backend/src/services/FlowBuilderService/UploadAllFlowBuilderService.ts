import { FlowAudioModel } from "../../models/FlowAudio";
import { FlowBuilderModel } from "../../models/FlowBuilder";
import { FlowImgModel } from "../../models/FlowImg";
import { WebhookModel } from "../../models/Webhook";
import { randomString } from "../../utils/randomCode";

interface Request {
  userId: number;
  medias: Express.Multer.File[];
  companyId: number;
}

const UploadAllFlowBuilderService = async ({
  userId,
  medias,
  companyId
}: Request): Promise<string[]> => {
  try {
    let itemsNewNames: string[] = [];
    let itemsUrls: string[] = [];

    for (let i = 0; medias.length > i; i++) {
      let nameFile = medias[i].filename;
      itemsNewNames = [...itemsNewNames, nameFile];
      itemsUrls = [...itemsUrls, `uploads/${nameFile}`];

      if (
        medias[i].mimetype.split("/")[1] === "png" ||
        medias[i].mimetype.split("/")[1] === "jpg" ||
        medias[i].mimetype.split("/")[1] === "jpeg"
      ) {
        await FlowImgModel.create({
          userId: userId,
          companyId: companyId,
          name: nameFile
        });
      }
      else if (
        medias[i].mimetype.split("/")[1] === "mp3" ||
        medias[i].mimetype.split("/")[1] === "ogg" ||
        medias[i].mimetype.split("/")[1] === "mp4" ||
        medias[i].mimetype.split("/")[1] === "mpeg"
      ) {
        if (medias[i].mimetype.split("/")[1] === "mpeg") {
          nameFile = nameFile.split(".")[0] + ".mp3";
        }

        await FlowAudioModel.create({
          userId: userId,
          companyId: companyId,
          name: nameFile
        });
      }
      else if (
        medias[i].mimetype === "application/pdf" ||
        medias[i].mimetype.includes("spreadsheetml") ||
        medias[i].mimetype.includes("wordprocessingml") ||
        medias[i].mimetype.includes("msword") ||
        medias[i].mimetype.includes("ms-excel") ||
        medias[i].mimetype.includes("application/vnd.") ||
        medias[i].mimetype.includes("application/")
      ) {
        await FlowImgModel.create({
          userId: userId,
          companyId: companyId,
          name: nameFile
        });
      }
    }

    return itemsUrls;
  } catch (error) {
    console.error("Erro ao inserir o arquivo:", error);

    return error;
  }
};

export default UploadAllFlowBuilderService;
