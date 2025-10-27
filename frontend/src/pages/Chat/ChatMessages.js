import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  makeStyles,
  Paper,
  Typography,
  Modal,
  Button,
  CircularProgress,
  Grid,
  Tooltip,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import InsertEmoticonIcon from "@material-ui/icons/InsertEmoticon"; // Ícone de emoji
import AttachFileIcon from "@material-ui/icons/AttachFile"; // Ícone para anexos
import MicIcon from "@material-ui/icons/Mic"; // Ícone para gravação de áudio
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline"; // Ícone para confirmar gravação
import HighlightOffIcon from "@material-ui/icons/HighlightOff"; // Ícone para cancelar gravação
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Estilo do editor
import EmojiPicker from "emoji-picker-react"; // Seletor de emojis
import GetAppIcon from "@material-ui/icons/GetApp"; // Ícone de download
import PictureAsPdfIcon from "@material-ui/icons/PictureAsPdf"; // Ícone para PDF
import AudiotrackIcon from "@material-ui/icons/Audiotrack"; // Ícone para áudio

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";

import waBackground from "../../assets/wa-background.png"; // Importe a imagem de fundo

// Componente de timer para gravação
const RecordingTimer = () => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Typography variant="body2" style={{ margin: "0 10px" }}>
      {formatTime(timer)}
    </Typography>
  );
};

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    height: "100%",
    borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  },
  messageList: {
    position: "relative",
    overflowY: "auto",
    height: "100%",
    ...theme.scrollbarStyles,
    backgroundColor: theme.mode === "light" ? "#f2f2f2" : "#7f7f7f",
    backgroundImage: `url(${waBackground})`, // Adicione a imagem de fundo aqui
    backgroundSize: "auto", // Mantém o tamanho original da imagem
    backgroundRepeat: "repeat", // Repete a imagem tanto horizontal quanto verticalmente
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.5)", // Overlay branco semi-transparente
      pointerEvents: "none", // Permite interação com os elementos abaixo
    },
  },
  inputArea: {
    position: "relative",
    height: "auto",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    backgroundColor: theme.mode === "light" ? "#f5f5f5" : "#1e1e1e",
    borderTop: "1px solid rgba(0, 0, 0, 0.12)",
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  buttonsContainer: {
    display: "flex",
    gap: "5px",
    marginRight: "10px",
  },
  actionButton: {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    width: "36px",
    height: "36px",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  editor: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #ddd",
    minHeight: "50px",
    maxHeight: "120px",
    overflowY: "auto",
    flexGrow: 1,
    width: "calc(100% - 110px)", // Ajuste para caber tudo na linha
    "& .ql-toolbar": {
      borderTopLeftRadius: "8px",
      borderTopRightRadius: "8px",
      borderBottom: "1px solid #ddd",
      padding: "4px",
    },
    "& .ql-container": {
      borderBottomLeftRadius: "8px",
      borderBottomRightRadius: "8px",
      fontSize: "14px",
      maxHeight: "80px",
    },
    "& .ql-editor": {
      padding: "8px",
      maxHeight: "80px",
    },
  },
  boxLeft: {
    padding: "10px 10px 5px",
    margin: "10px",
    position: "relative",
    backgroundColor: "#ffffff",
    color: "#303030",
    maxWidth: 300,
    borderRadius: 10,
    borderBottomLeftRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    zIndex: 1, // Garante que as mensagens fiquem acima do overlay
  },
  boxRight: {
    padding: "10px 10px 5px",
    margin: "10px 10px 10px auto",
    position: "relative",
    backgroundColor: "#dcf8c6",
    color: "#303030",
    textAlign: "right",
    maxWidth: 300,
    borderRadius: 10,
    borderBottomRightRadius: 0,
    border: "1px solid rgba(0, 0, 0, 0.12)",
    zIndex: 1, // Garante que as mensagens fiquem acima do overlay
  },
  emojiPicker: {
    position: "absolute",
    bottom: "100%",
    left: 0, // Posiciona o seletor de emojis à esquerda
    zIndex: 10,
  },
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    textAlign: "center",
  },
  modalImage: {
    maxWidth: "90%",
    maxHeight: "80vh",
    marginBottom: theme.spacing(2),
  },
  downloadButton: {
    marginTop: theme.spacing(2),
  },
  mediaContainer: {
    marginTop: 10,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  mediaImage: {
    maxWidth: "100%",
    maxHeight: "200px",
    borderRadius: 5,
    cursor: "pointer",
  },
  mediaFile: {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    backgroundColor: "#f8f8f8",
    borderRadius: "8px",
    margin: "5px 0",
    cursor: "pointer",
    border: "1px solid #ddd",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    maxWidth: "100%",
  },
  mediaFileIcon: {
    marginRight: "8px",
    color: "#e91e63",
    fontSize: "24px",
    flexShrink: 0,
  },
  mediaFileName: {
    flexGrow: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "200px",
    fontSize: "13px",
  },
  audioPlayer: {
    width: "100%",
    marginTop: "5px",
  },
  recorderWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: "20px",
    padding: "5px",
    marginBottom: "10px",
  },
  selectedFilesPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "10px",
    padding: "8px",
    backgroundColor: "#f0f0f0",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  selectedFileItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "8px",
    position: "relative",
    border: "1px solid #ddd",
    width: "100px",
  },
  removeFileButton: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    fontSize: "small",
    backgroundColor: "red",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
}));

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo,
  loading,
}) {
  const classes = useStyles();
  const { user, socket } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const baseRef = useRef();
  const isMounted = useRef(true);

  const [contentMessage, setContentMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Estado para controlar a exibição do seletor de emojis
  const [selectedImage, setSelectedImage] = useState(null); // Estado para controlar a imagem selecionada para ampliar
  const [selectedFile, setSelectedFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({});
    }
  };

  const unreadMessages = (chat) => {
    if (chat !== undefined) {
      const currentUser = chat.users.find((u) => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  const handleSend = () => {
    if (selectedFiles.length > 0) {
      handleSendWithMedia();
    } else if (contentMessage.trim() !== "") {
      handleSendMessage(contentMessage);
      setContentMessage("");
    }
  };

  // Função para adicionar emoji ao conteúdo da mensagem
  const handleEmojiClick = (emojiObject) => {
    setContentMessage((prevMessage) => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false); // Fecha o seletor de emojis após a seleção
  };

  // Função para abrir a imagem no modal
  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
  };

  // Função para abrir arquivo no modal
  const handleFileClick = (fileSrc) => {
    setSelectedFile(fileSrc);
    window.open(fileSrc, "_blank");
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  // Função para baixar a imagem ou arquivo
  const handleDownloadMedia = () => {
    if (selectedImage) {
      const link = document.createElement("a");
      link.href = selectedImage;
      link.download = selectedImage.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (selectedFile) {
      const link = document.createElement("a");
      link.href = selectedFile;
      link.download = selectedFile.split("/").pop();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Função para lidar com upload de arquivos
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Função para remover um arquivo selecionado
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Função para enviar mensagem com mídia
  const handleSendWithMedia = async () => {
    const formData = new FormData();
    formData.append("message", contentMessage);
    selectedFiles.forEach((file) => {
      formData.append("medias", file);
    });

    try {
      await api.post(`/chats/${chat.id}/messages`, formData);
      setContentMessage("");
      setSelectedFiles([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Função para iniciar gravação de áudio
  const handleStartRecording = async () => {
    setAudioLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Verificar se MicRecorder está disponível na janela global
      if (!window.MicRecorder) {
        alert(
          "Biblioteca de gravação não está disponível. Por favor, recarregue a página."
        );
        setAudioLoading(false);
        return;
      }

      // Usar o construtor window.MicRecorder diretamente
      const recorder = new window.MicRecorder({ bitRate: 128 });
      window.currentChatRecorder = recorder;

      await recorder.start();
      setRecording(true);
      setAudioLoading(false);
    } catch (err) {
      console.error(err);
      setAudioLoading(false);
    }
  };

  // Função para cancelar gravação de áudio
  const handleCancelAudio = async () => {
    try {
      const recorder = window.currentChatRecorder;
      if (recorder) {
        await recorder.stop().getMp3();
        window.currentChatRecorder = null;
        setRecording(false);
      }
    } catch (err) {
      console.error(err);
      setRecording(false);
    }
  };

  // Função para enviar áudio gravado
  const handleUploadAudio = async () => {
    setAudioLoading(true);
    try {
      const recorder = window.currentChatRecorder;
      if (!recorder) {
        setAudioLoading(false);
        setRecording(false);
        return;
      }

      const [, blob] = await recorder.stop().getMp3();
      window.currentChatRecorder = null;

      if (blob.size < 10000) {
        alert("Áudio muito curto. Por favor, grave novamente.");
        setAudioLoading(false);
        setRecording(false);
        return;
      }

      const formData = new FormData();
      const filename = `${new Date().getTime()}.mp3`;
      formData.append("medias", blob, filename);
      formData.append("message", "");

      if (isMounted.current) {
        await api.post(`/chats/${chat.id}/messages`, formData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isMounted.current) {
        setAudioLoading(false);
        setRecording(false);
      }
    }
  };

  // Função para gerar preview do arquivo
  const getFilePreview = (file) => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith("audio/")) {
      return <AudiotrackIcon style={{ fontSize: 40 }} />;
    } else if (file.type === "application/pdf") {
      return <PictureAsPdfIcon style={{ fontSize: 40 }} />;
    } else {
      return <AttachFileIcon style={{ fontSize: 40 }} />;
    }
  };

  // Função para truncar o nome do arquivo
  const truncateFileName = (fileName, maxLength = 20) => {
    if (!fileName) return "";

    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.split(".").pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

    // Determina quantos caracteres podem ser mostrados do nome
    const availableChars = maxLength - extension.length - 3; // -3 para "..." e o ponto

    if (availableChars <= 0) return "..." + extension;

    const truncatedName = nameWithoutExt.substring(0, availableChars) + "...";
    return truncatedName + "." + extension;
  };

  // Efeito para adicionar eventos de clique nas imagens após o render
  useEffect(() => {
    const images = document.querySelectorAll(".messageContent img");
    images.forEach((img) => {
      img.style.cursor = "pointer";
      img.addEventListener("click", () => handleImageClick(img.src));
    });

    return () => {
      images.forEach((img) => {
        img.removeEventListener("click", () => handleImageClick(img.src));
      });
    };
  }, [messages]);

  // Função para renderizar mídia baseada na extensão do arquivo
  const renderMedia = (mediaPath) => {
    if (!mediaPath) return null;

    // Determinar a URL base do backend
    // Precisamos garantir que estamos usando o URL do backend, não do frontend
    const backendUrl =
      process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

    // Garantir que temos o caminho completo do servidor
    let fullPath = mediaPath;
    if (!mediaPath.startsWith("http")) {
      // Usando URL direta do backend para arquivos de mídia
      fullPath = `${backendUrl}${mediaPath}`;
    }

    const fileName = mediaPath.split("/").pop();
    const extension = fileName.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return (
        <img
          src={fullPath}
          alt="Mídia"
          className={classes.mediaImage}
          onClick={() => handleImageClick(fullPath)}
        />
      );
    } else if (["mp3", "ogg", "wav"].includes(extension)) {
      return (
        <audio controls className={classes.audioPlayer}>
          <source src={fullPath} type={`audio/${extension}`} />
          Seu navegador não suporta o elemento de áudio.
        </audio>
      );
    } else {
      return (
        <Tooltip title={fileName}>
          <div
            className={classes.mediaFile}
            onClick={() => handleFileClick(fullPath)}
          >
            {extension === "pdf" ? (
              <PictureAsPdfIcon className={classes.mediaFileIcon} />
            ) : (
              <AttachFileIcon className={classes.mediaFileIcon} />
            )}
            <Typography variant="body2" className={classes.mediaFileName}>
              {truncateFileName(fileName, 30)}
            </Typography>
          </div>
        </Tooltip>
      );
    }
  };

  // Configuração da barra de ferramentas do editor
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"], // Negrito, Itálico, Sublinhado, Taxado
      ["image"], // Inserir imagem
    ],
  };

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {Array.isArray(messages) &&
          messages.map((item, key) => {
            if (item.senderId === user.id) {
              return (
                <Box key={key} className={classes.boxRight}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  <div
                    className="messageContent"
                    dangerouslySetInnerHTML={{ __html: item.message }}
                  />
                  {item.mediaPath && (
                    <div className={classes.mediaContainer}>
                      {renderMedia(item.mediaPath)}
                    </div>
                  )}
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
              );
            } else {
              return (
                <Box key={key} className={classes.boxLeft}>
                  <Typography variant="subtitle2">
                    {item.sender.name}
                  </Typography>
                  <div
                    className="messageContent"
                    dangerouslySetInnerHTML={{ __html: item.message }}
                  />
                  {item.mediaPath && (
                    <div className={classes.mediaContainer}>
                      {renderMedia(item.mediaPath)}
                    </div>
                  )}
                  <Typography variant="caption" display="block">
                    {datetimeToClient(item.createdAt)}
                  </Typography>
                </Box>
              );
            }
          })}
        <div ref={baseRef}></div>
      </div>

      <div className={classes.inputArea}>
        {selectedFiles.length > 0 && (
          <div className={classes.selectedFilesPreview}>
            <Grid container spacing={1}>
              {selectedFiles.map((file, index) => (
                <Grid item key={index} xs={6} sm={3} md={2}>
                  <div className={classes.selectedFileItem}>
                    {typeof getFilePreview(file) === "string" ? (
                      <img
                        src={getFilePreview(file)}
                        alt={file.name}
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                          marginBottom: "5px",
                        }}
                      />
                    ) : (
                      <div style={{ margin: "10px 0" }}>
                        {getFilePreview(file)}
                      </div>
                    )}
                    <Tooltip title={file.name}>
                      <Typography
                        variant="caption"
                        noWrap
                        style={{ width: "90%", textAlign: "center" }}
                      >
                        {truncateFileName(file.name, 15)}
                      </Typography>
                    </Tooltip>
                    <div
                      className={classes.removeFileButton}
                      onClick={() => handleRemoveFile(index)}
                    >
                      ×
                    </div>
                  </div>
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {recording ? (
          <div className={classes.recorderWrapper}>
            <IconButton onClick={handleCancelAudio} disabled={audioLoading}>
              <HighlightOffIcon style={{ color: "red" }} />
            </IconButton>

            {audioLoading ? <CircularProgress size={24} /> : <RecordingTimer />}

            <IconButton onClick={handleUploadAudio} disabled={audioLoading}>
              <CheckCircleOutlineIcon style={{ color: "green" }} />
            </IconButton>
          </div>
        ) : (
          <>
            <div className={classes.controlsRow}>
              <div className={classes.buttonsContainer}>
                <IconButton
                  className={classes.actionButton}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  size="small"
                >
                  <InsertEmoticonIcon fontSize="small" />
                </IconButton>

                <IconButton
                  className={classes.actionButton}
                  component="label"
                  size="small"
                >
                  <AttachFileIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,audio/*,video/*,application/*"
                  />
                </IconButton>

                <IconButton
                  className={classes.actionButton}
                  onClick={handleStartRecording}
                  disabled={audioLoading}
                  size="small"
                >
                  <MicIcon fontSize="small" />
                </IconButton>
              </div>

              <ReactQuill
                value={contentMessage}
                onChange={setContentMessage}
                className={classes.editor}
                modules={modules}
              />

              <IconButton
                className={classes.actionButton}
                onClick={handleSend}
                style={{ marginLeft: "8px" }}
                size="small"
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </div>
          </>
        )}

        {showEmojiPicker && (
          <div className={classes.emojiPicker}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              height={350}
              width={350}
            />
          </div>
        )}
      </div>

      {/* Modal para exibir a imagem ampliada */}
      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        className={classes.modal}
      >
        <div className={classes.modalContent}>
          <img
            src={selectedImage}
            alt="Ampliada"
            className={classes.modalImage}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<GetAppIcon />}
            onClick={handleDownloadMedia}
            style={{
              color: "white",
              backgroundColor: "#437db5",
              boxShadow: "none",
              borderRadius: 0,
            }}
          >
            Baixar Imagem
          </Button>
        </div>
      </Modal>
    </Paper>
  );
}
