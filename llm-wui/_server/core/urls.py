from django.urls import path
from . import views

urlpatterns = [
    path('', view=views.index, name="index"),
    path('send_chat', view=views.send_chat, name="send_chat"),
    path('delete_chat', view=views.delete_chat, name="delete_chat")
]
