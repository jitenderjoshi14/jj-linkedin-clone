import { signInWithPopup } from "firebase/auth";
import db, { auth, provider, storage } from "../firebase";
import { SET_USER, SET_LOADING_STATUS, GET_ARTICLES } from "./actionType";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  orderBy,
  doc,
  getDocs,
  where,
  query,
} from "firebase/firestore";

export const setUser = (payload) => ({
  type: SET_USER,
  user: payload, //saving payload to userReducer
});

export const setLoading = (status) => ({
  type: SET_LOADING_STATUS,
  status: status,
});

export const getArticles = (payload) => ({
  type: GET_ARTICLES,
  payload: payload,
});

export function signInAPI() {
  return (dispatch) => {
    signInWithPopup(auth, provider)
      .then((payload) => dispatch(setUser(payload.user))) //sending payload to setUser
      .catch((err) => alert(err.message));
  };
}

export function getUserAuth() {
  return (dispatch) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        dispatch(setUser(user));
      }
    });
  };
}

export function signOutAPI() {
  return (dispatch) => {
    auth
      .signOut()
      .then(() => {
        dispatch(setUser(null));
      })
      .catch((error) => {
        //console.log(error.message);
      });
  };
}

export function postArticleAPI(payload) {
  return (dispatch) => {
    dispatch(setLoading(true)); //start loading spinner

    if (payload.image !== "") {
      const storageRef = ref(storage, `images/${payload.image.name}`);

      const uploadTask = uploadBytesResumable(storageRef, payload.image);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // console.log(`Upload is ${progress} % done`);

          switch (snapshot.state) {
            case "paused":
              //console.log("Upload is paused");
              break;
            case "running":
              // console.log("upload is running");
              break;
            default:
            // console.log("default case");
          }
        },
        (error) => {
          // console.log(error.code);
        },

        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          addDoc(collection(db, "articles"), {
            actor: {
              description: payload.user.email,
              title: payload.user.displayName,
              date: payload.timestamp,
              image: payload.user.photoURL,
            },
            video: payload.video,
            sharedImage: downloadURL,
            comments: 0,
            description: payload.description,
          });
          dispatch(setLoading(false)); //finish  loading :- stop spinner
        }
      );
    } else if (payload.video) {
      addDoc(collection(db, "articles"), {
        actor: {
          description: payload.user.email,
          title: payload.user.displayName,
          date: payload.timestamp,
          image: payload.user.photoURL,
        },
        video: payload.video,
        sharedImage: "",
        comments: 0,
        description: payload.description,
      });
      dispatch(setLoading(false)); //finish  loading :- stop spinner
    }
  };
}

export function getArticlesAPI() {
  return async (dispatch) => {
    let payload;
    const q = query(collection(db, "articles"), orderBy("actor.date", "desc"));
    const querySnapShot = await getDocs(q);
    // console.log(querySnapShot.docs);
    // querySnapShot.forEach((doc) => {
    //   console.log(doc.data());
    // });
    payload = querySnapShot.docs.map((doc) => doc.data());

    dispatch(getArticles(payload));
  };
}
