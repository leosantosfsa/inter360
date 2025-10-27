import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import AddIcon from "@mui/icons-material/Add";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { SocketContext } from "../../context/Socket/SocketContext";
import WebhookModal from "../../components/WebhookModal";
import {
  AddCircle,
  Build,
  ContentCopy,
  DevicesFold,
  MoreVert,
  WebhookOutlined,
} from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";

import FlowBuilderModal from "../../components/FlowBuilderModal";

import {
  colorBackgroundTable,
  colorLineTable,
  colorLineTableHover,
  colorPrimary,
  colorTitleTable,
  colorTopTable,
} from "../../styles/styles";

import GetAppIcon from "@mui/icons-material/GetApp";
import UploadIcon from "@mui/icons-material/Upload";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Input from "@mui/material/Input";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach((contact) => {
      const contactIndex = state.findIndex((c) => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex((c) => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex((c) => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    backgroundColor: "#444394",
    borderRadius: 0,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user, socket } = useContext(AuthContext);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [navigationConfirmOpen, setNavigationConfirmOpen] = useState(false);
  const [successfulImport, setSuccessfulImport] = useState(false);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  useEffect(() => {
    const companyId = user.companyId;

    const onContact = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };

    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = () => {
    setSelectedContactId(deletingContact.id);
    setSelectedWebhookName(deletingContact.name);
    setContactModalOpen(true);
  };

  const handleDeleteWebhook = async (webhookId) => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`).then((res) => {
        setDeletingContact(null);
        setReloadData((old) => !old);
      });
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async (flowId) => {
    try {
      await api
        .post(`/flowbuilder/duplicate`, { flowId: flowId })
        .then((res) => {
          setDeletingContact(null);
          setReloadData((old) => !old);
        });
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportLink = () => {
    history.push(`/flowbuilder/${deletingContact.id}`);
  };

  const handleExportFlow = async (flowId) => {
    try {
      toast.info("Preparando exportação do fluxo...");

      const response = await api.get(`/flowbuilder/export/${flowId}`, {
        responseType: "blob",
      });

      if (response.data.size === 0) {
        toast.error("Erro: O arquivo exportado está vazio");
        return;
      }

      const flowToExport = webhooks.find((wh) => wh.id === flowId);
      const flowName = flowToExport ? flowToExport.name : "fluxo";

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${flowName.replace(/\s+/g, "_").toLowerCase()}_export.json`
      );
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success("Fluxo exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar fluxo:", error);
      toast.error(
        "Erro ao exportar fluxo: " +
          (error.response?.data?.error || "Erro desconhecido")
      );
    }
  };

  const handleImportFlow = async () => {
    if (!importFile) {
      toast.error("Selecione um arquivo para importar");
      return;
    }

    if (!importFile.name.toLowerCase().endsWith(".json")) {
      toast.error("O arquivo deve ser do tipo JSON");
      return;
    }

    try {
      setImportLoading(true);
      toast.info("Importando fluxo, por favor aguarde...");

      const formData = new FormData();
      formData.append("file", importFile);

      const response = await api.post("/flowbuilder/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`Fluxo "${response.data.name}" importado com sucesso!`);
      setImportModalOpen(false);
      setImportFile(null);
      setReloadData((old) => !old);

      setSuccessfulImport(true);
      setNavigationConfirmOpen(true);
    } catch (error) {
      console.error("Erro ao importar fluxo:", error);
      const errorMsg = error.response?.data?.error || "Erro desconhecido";
      toast.error(`Erro ao importar fluxo: ${errorMsg}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleNavigationConfirm = () => {
    setReloadData((old) => !old);
    setNavigationConfirmOpen(false);
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData((old) => !old)}
      ></FlowBuilderModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={(e) =>
          deletingContact ? handleDeleteWebhook(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja deletar este fluxo? Todas as integrações relacionados serão perdidos.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `Deseja duplicar o fluxo ${deletingContact.name}?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmDuplicateOpen}
        onClose={setConfirmDuplicateOpen}
        onConfirm={(e) =>
          deletingContact ? handleDuplicateFlow(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja duplicar este fluxo?`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <Dialog open={importModalOpen} onClose={() => setImportModalOpen(false)}>
        <DialogTitle>Importar Fluxo</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Selecione um arquivo JSON exportado do FlowBuilder para importar.
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px dashed #ccc",
                borderRadius: "4px",
                padding: "16px",
                marginTop: "16px",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "#0872B9",
                },
              }}
            >
              <Input
                type="file"
                id="flow-import"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              <label htmlFor="flow-import">
                <UploadIcon sx={{ color: "#0872B9", fontSize: "40px" }} />
                <Typography
                  variant="body1"
                  sx={{ color: "#0872B9", marginTop: "8px" }}
                >
                  {importFile
                    ? `${importFile.name} (${(importFile.size / 1024).toFixed(
                        2
                      )} KB)`
                    : "Escolha um arquivo JSON"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", marginTop: "4px" }}
                >
                  {importFile
                    ? "Arquivo selecionado"
                    : "Clique para selecionar o arquivo"}
                </Typography>
              </label>
            </Box>
            {importFile && (
              <Typography
                variant="body2"
                sx={{ color: "green", mt: 2, textAlign: "center" }}
              >
                Arquivo pronto para importação! Clique em "Importar" para
                continuar.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportModalOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleImportFlow}
            disabled={!importFile || importLoading}
            variant="contained"
            color="primary"
          >
            {importLoading ? <CircularProgress size={24} /> : "Importar"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={navigationConfirmOpen}
        onClose={() => setNavigationConfirmOpen(false)}
      >
        <DialogTitle>Importação Concluída</DialogTitle>
        <DialogContent>
          <Typography>
            {successfulImport
              ? "Fluxo importado com sucesso! A lista foi atualizada."
              : "A lista de fluxos foi atualizada."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNavigationConfirmOpen(false)}
            variant="contained"
            color="primary"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <MainHeader>
        <Title>Flow Builder</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              style: {
                color: colorTitleTable(),
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#FFA500" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            sx={{ marginLeft: "10px", marginRight: "10px" }}
            variant="contained"
            color="primary"
            onClick={() => setImportModalOpen(true)}
            startIcon={<UploadIcon />}
          >
            Importar Fluxo
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenContactModal}
            startIcon={<AddIcon />}
          >
            <Stack direction={"row"} gap={1}>
              {"Adicionar Fluxo"}
            </Stack>
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Stack>
          <Grid container style={{ padding: "8px" }}>
            <Grid item xs={4} style={{ color: colorTopTable() }}>
              {i18n.t("contacts.table.name")}
            </Grid>
            <Grid item xs={4} style={{ color: colorTopTable() }} align="center">
              Status
            </Grid>
            <Grid item xs={4} align="end" style={{ color: colorTopTable() }}>
              {i18n.t("contacts.table.actions")}
            </Grid>
          </Grid>
          <>
            {webhooks.map((contact) => (
              <Grid
                container
                key={contact.id}
                sx={{
                  padding: "8px",
                  backgroundColor: "#ffffff",
                  borderRadius: 0,
                }}
              >
                <Grid
                  item
                  xs={4}
                  onClick={() => history.push(`/flowbuilder/${contact.id}`)}
                >
                  <Stack
                    justifyContent={"center"}
                    height={"100%"}
                    style={{ color: "#444394" }}
                  >
                    <Stack direction={"row"}>
                      <DevicesFold />
                      <Stack justifyContent={"center"} marginLeft={1}>
                        {contact.name}
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid
                  item
                  xs={4}
                  align="center"
                  style={{ color: "#444394" }}
                  onClick={() => history.push(`/flowbuilder/${contact.id}`)}
                >
                  <Stack justifyContent={"center"} height={"100%"}>
                    {contact.active ? "Ativo" : "Desativado"}
                  </Stack>
                </Grid>
                <Grid item xs={4} align="end">
                  <Button
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={(e) => {
                      handleClick(e);
                      setDeletingContact(contact);
                    }}
                    sx={{ borderRadius: "36px", minWidth: "24px" }}
                  >
                    <MoreVert
                      sx={{ color: "#444394", width: "21px", height: "21px" }}
                    />
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              sx={{ borderRadius: "40px" }}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button",
              }}
            >
              <MenuItem
                onClick={() => {
                  handleClose();
                  hadleEditContact();
                }}
              >
                Editar nome
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  exportLink();
                }}
              >
                Editar fluxo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  handleExportFlow(deletingContact.id);
                }}
              >
                Exportar Fluxo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  setConfirmDuplicateOpen(true);
                }}
              >
                Duplicar
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose();
                  setConfirmOpen(true);
                }}
              >
                Excluir
              </MenuItem>
            </Menu>
            {loading && (
              <Stack
                justifyContent={"center"}
                alignItems={"center"}
                minHeight={"50vh"}
              >
                <CircularProgress />
              </Stack>
            )}
          </>
        </Stack>
      </Paper>
    </MainContainer>
  );
};

export default FlowBuilder;
