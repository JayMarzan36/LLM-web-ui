from django.urls import path
from . import views

urlpatterns = [
    path('', view=views.index, name="index"),
    path('send_chat', view=views.send_chat, name="send_chat"),
    path('delete_chat', view=views.delete_chat, name="delete_chat"),
    path('get_chats', view=views.get_chats, name="get_chats"),
    path('load_chat', view=views.load_chat, name="load_chat"),
    path('get_models', view=views.get_models, name="get_models")
]
